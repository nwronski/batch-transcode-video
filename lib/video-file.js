import path from 'path';
import Promise from 'bluebird';
import TranscodeError from './transcode-error.js';
import {stat as _stat, unlinkSync} from 'fs';
let stat = Promise.promisify(_stat);
import _mkdirp from 'mkdirp';
let mkdirp = Promise.promisify(_mkdirp);
import ChildPromise, {windowsCommand} from './child-promise.js';
import {parse} from 'shell-quote';
import {strToMilliseconds as strToMs} from './util.js';

let progressPattern = 'Encoding: task';
let progressPercent = /(\d{1,3}\.\d{1,2})\s*\%/;
let timePattern = '([0-9]{2}\:[0-9]{2}\:[0-9]{2})';
let handbrakeLogTime = new RegExp(`^${timePattern}`);
let handbrakeLogBitrate = /[0-9]+\.[0-9]+\s[^\s]+/i;
let handbrakeFinish = new RegExp('Encode done!', 'mi');
let handbrakeRuntime = new RegExp(`Elapsed time:\\s+${timePattern}`, 'mi');
let cropValuePattern = /\-{2}crop\s+([0-9]+\:[0-9]+\:[0-9]+\:[0-9]+)/i;
function cropDelta(command) {
  let cropRaw = command.match(cropValuePattern);
  if (cropRaw === null) { return null; }
  return cropRaw[1]
  .split(':')
  .reduce((t, val) => t + Number.parseInt(val, 10), 0);
}

function cropCompareFunc(a, b) {
  let cropA = cropDelta(a);
  let cropB = cropDelta(b);
  if (cropA === null) {
    return 1;
  } else if (cropB === null) {
    return -1;
  }
  return cropA >= cropB ? 1 : -1;
}

export default class VideoFile {
  static get QUEUED() { return 0; }
  static get RUNNING() { return 1; }
  static get WRITTEN() { return 2; }
  static get ERRORED() { return 3; }
  static get SKIPPED() { return 4; }

  constructor(filePath, stats, options, transcodeOptions = [], estimator = function () { return null; }) {
    this.getEstSpeed = estimator;
    this.options = options;
    this.transcodeOptions = transcodeOptions;
    this.status = VideoFile.QUEUED;
    this.shouldDelete = false;

    this.lastPercent = 0;

    this._crop = null;
    this._encode = null;
    this._query = null;

    this.error = null;
    this.encodeBitrate = null;

    this.fileName = path.basename(filePath);
    this.filePathDir = path.dirname(filePath);
    this.filePathRel = path.relative(this.options['curDir'], filePath);
    this.destFileName = path.basename(this.fileName, path.extname(this.fileName)) + '.' + this.options['destExt'];
    this.destFileDir = this.options['output'] ? (!this.options['flatten'] ?
        // Add relative paths from --input to filePathDir when --o given
        path.resolve(this.options['output'], path.relative(this.options['input'], this.filePathDir)) :
        // --flatten option so do not add relative path
        this.options['output']) :
        // Output is same place a input
        this.filePathDir;
    this.destFilePath = path.normalize(this.destFileDir + path.sep + this.destFileName);
    this.destFilePathRel = path.relative(this.options['curDir'], this.destFilePath);
    this.fileSize = Number.parseInt(stats.size / 1000000.0, 10);
    this._ready = this._resolveDest();
    return this;
  }

  transcode() {
    return this._ready
    .then(() => {
      if (!this.isReady) {
        throw new TranscodeError('File cannot be processed again.', this.fileName);
      } else if (this.destFileExists) {
        if (this.options['diff']) {
          this.status = VideoFile.SKIPPED;
          return Promise.resolve(false);
        } else {
          throw new TranscodeError('File already exists in output directory.', this.fileName);
        }
      } else {
        this.startTime = Date.now();
        this.lastTime = this.startTime;
        this.status = VideoFile.RUNNING;

        return this._detectCrop()
        .then(args => this._startEncode(args))
        .then(didFinish => this._encodeStatus(didFinish))
        .then(() => {
          this.lastPercent = 1.0;
          this.status = VideoFile.WRITTEN;
          return true;
        });
      }
    })
    .catch((e) => {
      this.error = e;
      this.status = VideoFile.ERRORED;
    });
  }

  kill() {
    if (this._encode !== null) {
      this._encode.kill();
    }
    // Handle SIGINT
    if (this.isRunning) {
      this.status = VideoFile.ERRORED;
    }
    try {
      if (this.isMarkedForDeletion) {
        // Try and delete the destination file if it exists
        unlinkSync(this.destFilePath);
      }
    } catch (e) {}
  }

  _detectCrop() {
    let prom;
    let isNoCrop = this.options['nocrop'] === true;
    let isFixedCrop = /([0-9]+\:){3}[0-9]+/.test(this.options['crop']);
    if (isNoCrop || isFixedCrop) {
      const useCommand = [ 'transcode-video' ];
      if (isFixedCrop && !isNoCrop) {
        // Force the crop value provided using the --crop option
        useCommand.push('--crop', this.options['crop'].trim());
      }
      useCommand.push(this.filePathRel);
      this._crop = prom = Promise.resolve(useCommand.join(' '));
    } else {
      this._crop = new ChildPromise({
        cmd: 'detect-crop',
        args: [this.filePathRel],
        fileName: this.fileName,
        cwd: this.options['curDir']
      });
      prom = this._crop.start();
    }
    return prom
    .then((output) => {
      // Make sure conflicting results are not returned from detect-crop
      let useCommands = output
      .replace(/^\s+|\s+$/g, '')
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => /^transcode\-video/.test(line));
      if (useCommands.length === 0) {
        throw new TranscodeError('Crop detection failed. Skipping transcode for file.', this.fileName, output);
      } else if (useCommands.length > 1) {
        if (this.options['crop'] !== false) {
          // Pick the least extreme crop
          useCommands.sort(cropCompareFunc);
        } else {
          let cropResults = useCommands.map(val => {
            let m = val.match(cropValuePattern);
            return m !== null ? m[1] : '(unknown)';
          }).join(', ');
          throw new TranscodeError(`Crop detection returned conflicting results: ${cropResults}.`, this.fileName, useCommands.join('\n'));
        }
      }
      return useCommands[0];
    })
    .then((command) => {
      let useArgs = parse(command);
      useArgs.splice(1, 0, this.filePathRel, '--output', this.destFileDir);
      useArgs.splice.apply(useArgs, [useArgs.length - 1, 0].concat(this.transcodeOptions));
      let crop = useArgs.indexOf('--crop') + 1;
      if (crop > 0) {
        this.cropValue = useArgs[crop];
      } else if (this.options['nocrop'] !== true) {
        throw new TranscodeError('Could not detect crop values. Skipping transcode for file.', this.fileName, command);
      }
      return useArgs;
    });
  }

  _startEncode([cmd, ...args]) {
    // This step is the earliest we would have a partially-encoded, new file in the destination directory
    this.shouldDelete = true;
    this._encode = new ChildPromise({
      cmd,
      args,
      fileName: this.destFileName,
      cwd: this.options['curDir'],
      onData: (data) => {
        let lastIndex = data.lastIndexOf(progressPattern);
        if (lastIndex !== -1) {
          let lastData = data.substr(lastIndex);
          if (progressPercent.test(lastData)) {
            let matches = lastData.match(progressPercent);
            this.lastPercent = Number.parseFloat(matches[1]) / 100.0;
            this.lastTime = Date.now();
          }
        }
      }
    });
    return this._encode.start()
    .then((output) => {
      // Get total running time
      if (this.options['dryRun']) {
        return false;
      } else {
        // Check the output from the transcode to confirm it finished
        if (!handbrakeFinish.test(output)) {
          throw new TranscodeError('Transcode probably did not succeed for file.', this.destFileName, output);
        }
        this.totalEncodeTime = null;
        this.lastTime = Date.now();
        this.lastPercent = 1.0;
        let transcodeRuntime = output.match(handbrakeRuntime);
        if (transcodeRuntime != null) {
          this.totalEncodeTime = strToMs(transcodeRuntime[1]);
        } else if (this.options['debug']) {
          console.log(`unable to determine running time from transcode log: ${this.destFileName}`);
        }
        return true;
      }
    });
  }

  _encodeStatus(didFinish) {
    if (!didFinish) {
      return Promise.resolve(true);
    }
    this._query = new ChildPromise({
      cmd: 'query-handbrake-log',
      args: ['bitrate', `${this.destFilePath}.log`],
      fileName: this.destFileName,
      cwd: this.options['curDir']
    });
    return this._query.start()
    .then((log) => {
      let matches = `${log}`.trim().match(handbrakeLogBitrate);
      this.encodeBitrate = matches[0];
      return true;
    })
    .catch((err) => {
      // We failed to get bitrate from the log, but that doesn't mean we failed
      if (this.options['debug']) {
        console.log(`unable to get bitrate from encoding log: ${err.message}`);
      }
      this.encodeBitrate = null;
      return true;
    });
  }

  _resolveDest() {
    return stat(this.destFilePathRel)
    .then(() => {
      this.destFileExists = true;
      return true;
    }, () => {
      this.destFileExists = false;
      return mkdirp(this.destFileDir, {});
    });
  }

  get currentPercent() {
    if (!this.isRunning) {
      return this.lastPercent;
    } else if (this.lastPercent <= 0) {
      // Determine whether we should guess
      if (this.isRunning) {
        let est = this.getEstSpeed();
        return (this.currentTime / est) / this.fileSize;
      }
      return 0;
    }
    return this.currentTime / this.totalTime;
  }

  get currentTime() {
    return Date.now() - this.startTime;
  }

  get totalTime() {
    return (this.lastTime - this.startTime) / this.lastPercent;
  }

  get remainingTime() {
    if (this.lastPercent > 0) {
      return Math.max(this.totalTime - this.currentTime, 0);
    }
    if (this.isRunning) {
      let est = this.getEstSpeed();
      return (this.fileSize * est) - this.currentTime;
    }
    return 0;
  }

  get isReady() {
    return this.status === VideoFile.QUEUED;
  }

  get isRunning() {
    return this.status === VideoFile.RUNNING;
  }

  get isSkipped() {
    return this.status === VideoFile.SKIPPED;
  }

  get isWritten() {
    return this.status === VideoFile.WRITTEN;
  }

  get isErrored() {
    return this.status === VideoFile.ERRORED;
  }

  get isFinished() {
    return this.isWritten || this.isErrored ||  this.isSkipped;
  }

  get isMarkedForDeletion() {
    return this.isErrored && this.shouldDelete && this.options['keep'] !== true;
  }
};
