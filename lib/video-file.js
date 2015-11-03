import path from 'path';
import Promise from 'bluebird';
import TranscodeError from './transcode-error.js';
import {stat as _stat} from 'fs';
let stat = Promise.promisify(_stat);
import _mkdirp from 'mkdirp';
let mkdirp = Promise.promisify(_mkdirp);
import ChildPromise from './child-promise.js';
import {parse} from 'shell-quote';

// import * as say from './say.js';

let progressPattern = 'Encoding: task';
let progressPercent = /(\d{1,3}\.\d{1,2})\s*\%/;
let timePattern = '([0-9]{2}\:[0-9]{2}\:[0-9]{2})';
let handbrakeLog = new RegExp(`^${timePattern}`);
let handbrakeFinish = new RegExp(`Encode done![\n\s]*HandBrake has exited.[\s\n]*Elapsed time: ${timePattern}`, 'i');

export default class VideoFile {
  static get QUEUED() { return 0; }
  static get RUNNING() { return 1; }
  static get WRITTEN() { return 2; }
  static get ERRORED() { return 3; }
  static get SKIPPED() { return 4; }

  constructor(filePath, stats, options) {
    this.options = options;
    this.status = VideoFile.QUEUED;

    this.lastPercent = 0;
    this.quant = 0; // TODO: keep this?

    this._crop = null;
    this._encode = null;
    this._query = null;

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
      console.log(this.error.toString());
    });
  }

  _detectCrop() {
    this._crop = new ChildPromise({
      cmd: 'detect-crop',
      args: [this.filePathRel],
      fileName: this.fileName,
      cwd: this.options['curDir']
    });
    return this._crop.start()
    .then((output) => {
      let useCommand = output.replace(/[\S]+$/gm, '').split(/\n+/).slice(-1)[0].trim();
      if (!/^transcode\-video/.test(useCommand)) {
        throw new TranscodeError('Crop detection failed. Skipping transcode for file.', this.fileName, useCommand);
      }
      return useCommand;
    })
    .then((command) => {
      let useArgs = parse(command);
      useArgs.splice(1, 0, this.filePathRel, '--output', this.destFileDir);
      useArgs.splice.apply(useArgs, [useArgs.length - 1, 0].concat(this.options['transcodeOptions']));
      let crop = useArgs.indexOf('--crop') + 1;
      if (crop > 0) {
        this.cropValue = useArgs[crop];
        // say.notify(`Crop values detected for file: ${useArgs[crop]}.`, say.DEBUG, fileName, command);
      } else {
        throw new TranscodeError('Could not detect crop values. Skipping transcode for file.', this.fileName, command);
      }
      return useArgs;
    });
  }

  _startEncode([cmd, ...args]) {
    // say.notify('Starting transcoding operation for file.', say.DEBUG, fileName, args.join(' '));
    this._encode = new ChildPromise({
      cmd,
      args,
      fileName: this.destFileName,
      cwd: this.options['curDir'],
      onData: function (data) {
        let lastIndex = data.lastIndexOf(progressPattern);
        if (lastIndex !== -1 && progressPercent.test(data)) {
          let matches = data.substr(lastIndex).match(progressPercent);
          this.lastPercent = Number.parseFloat(matches[1]) / 100.0;
          this.lastTime = Date.now();
        }
      }
    });
    return this._encode.start()
    .then((output) => {
      // Get total running time
      if (this.options['dryRun']) {
        // say.notify('Finished processing file.', say.INFO, this.destFilePath, output);
        return false;
      } else {
        // Check the output from the trasncode to confirm it finished
        let transcodeStatus = output.match(handbrakeFinish);
        if (transcodeStatus === null) {
          this.totalTime = null;
          throw new TranscodeError('Transcode probably did not succeed for file.', this.destFileName, output);
        } else {
          this.totalTime = transcodeStatus[1];
        }
        return true;
      }
    });
  }

  _encodeStatus(didFinish) {
    if (!didFinish) {
      this.encodeTime = null;
      return Promise.resolve(true);
    }
    this._query = new ChildPromise({
      cmd: 'query-handbrake-log',
      args: ['time', `${this.destFilePath}.log`],
      fileName: this.destFileName,
      cwd: this.options['curDir']
    });
    return this._query.start()
    .then((log) => {
      this.encodeTime = log.trim().match(timePattern)[1];
      // say.notify(`Total: ${this.totalTime. Transcoding: ${this.encodeTime}`, say.WRITE, this.destFilePath, output);
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

  get isReady() {
    return this.status === VideoFile.QUEUED;
  }

  get isRunning() {
    return this.status === VideoFile.RUNNING;
  }

  get isFinished() {
    return this.status === VideoFile.WRITTEN || this.status === VideoFile.ERRORED ||
        this.status === VideoFile.SKIPPED;
  }
};


/*
import chalk from 'chalk';
import options from './options.js';
import path from 'path';
import {resolve, denodeify} from 'promise';
import _mkdirp from 'mkdirp';
let mkdirp = denodeify(_mkdirp);
import {stat as _stat} from 'fs';
let stat = denodeify(_stat);
import childPromise from './child-promise.js';
import {parse} from 'shell-quote';
import * as say from './say.js';
import pace from 'pace';
let curDir = process.cwd();



function handbrakeProgress(str) {
  let quant;
  let lastIndex = str.lastIndexOf(progressPattern);
  if (lastIndex !== -1 && progressPercent.test(str)) {
    let matches = str.substr(lastIndex).match(progressPercent);
    quant = Number.parseFloat(matches[1]) / 100.0;
  }
  return quant;
}

function getErrorHandler(file) {
  return function (err) {
    err.file = err.file || file;
    say.notify(err);
  };
}

export default function transcoder(files) {
  let unknownSizes  = say.notify._fileCount;
  // TODO: get progress bar to render at 0%
  let progressBar   = pace({total: Math.max(unknownSizes * 100, 100)});
  let fileSizes     = [];
  let knownSizes    = (frac = 1.0) => (fileSizes.length ? Number.parseInt(fileSizes[0] * frac, 10) : 0) + fileSizes.slice(1).reduce((p, c) => p + c, 0);
  let currentQuant  = 0;
  let startTime = Date.now();
  let lastTime = startTime;

  let updateProgress = function updateProgress(f) {
    progressBar.op(Math.min(knownSizes(f), progressBar.total));
  };

  let progressTimer = setInterval(function timingFunction() {
    if (currentQuant > 0) {
      let currentTime = Date.now();
      let totalTime = (lastTime - startTime) / currentQuant;
      let elapsedSinceLast = (currentTime - startTime) / totalTime;
      updateProgress(Math.max(Math.min(elapsedSinceLast, 1.0), 0));
    } else {
      progressBar.op(Math.min(progressBar.current + (progressBar.total * 0.005), progressBar.total));
    }
  }, 1000);

  progressBar.op(1);

  let updateProgressTotal = function updateProgressTotal(size) {
    if (Number.isInteger(size)) {
      let sizeNorm = Number.parseInt(size / 1000000.0, 10);
      fileSizes.unshift(sizeNorm);
    } else {
      say.notify._fileCount -= 1;
      say.notify._skipCount += 1;
    }
    unknownSizes -= 1;
    let adjTotal = knownSizes();
    let avgSize = Number.parseInt(adjTotal / fileSizes.length, 10);
    adjTotal += avgSize * unknownSizes;
    progressBar.total = adjTotal;
    return adjTotal;
  };

  function processNext(arr) {
    if (arr.length) {
      dothing()
    }
    say.notify.stopProgressTimer();
    progressBar.op(progressBar.total);
    return resolve(true);
  }

  return processNext(files);
  */
