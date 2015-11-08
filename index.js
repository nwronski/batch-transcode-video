import Promise from 'bluebird';
import path from 'path';
import _glob from 'glob';
let glob = Promise.promisify(_glob);
import {stat as _stat} from 'fs';
let stat = Promise.promisify(_stat);
import TranscodeError from './lib/transcode-error.js';
import VideoFile from './lib/video-file.js';
import defaultOptions from './lib/default-options.js';

let destExtensionRegex = /^\-{2}(mp4|m4v)$/i;
let dryRunRegex = /^\-\-dry\-run$/i;

function sumFileSizes(files, useProperty = 'currentPercent') {
  return files.reduce(function (total, file) {
    return total + (file[useProperty] * file.fileSize);
  }, 0);
}

export default class BatchTranscodeVideo {
  static get INACTIVE() { return 0; }
  static get RUNNING() { return 1; }
  static get FINISHED() { return 2; }
  static get ERRORED() { return 3; }

  constructor(options, transcodeOptions) {
    options['curDir'] = process.cwd();
    options['input'] = path.relative(options['curDir'], options['input']);
    options['dryRun'] = transcodeOptions.length ? transcodeOptions.reduce(function (prev, cur) {
      return prev || dryRunRegex.test(cur.trim());
    }, false) : false;
    options['destExt'] = transcodeOptions.reduce(function (prev, cur) {
      let curArg = cur.trim();
      if (destExtensionRegex.test(curArg)) {
        return curArg.match(destExtensionRegex)[1];
      }
      return prev;
    }, 'mkv');
    this.filePattern = path.normalize(options['input'] + path.sep + options['mask']);
    this.options = Object.assign({}, defaultOptions, options);
    this.transcodeOptions = transcodeOptions.slice(0);
    this.status = BatchTranscodeVideo.INACTIVE;
    this.files = [];
    this.currentIndex = 0;
    this.error = null;
    this._ready = this.createEntries();
    return this;
  }

  createEntries() {
    return glob(this.filePattern, {})
    .then((files) => {
      if (files.length === 0) {
        throw new TranscodeError('No files found for search pattern provided.', this.filePattern);
      }
      return files;
    }, (err) => {
      throw new TranscodeError('File system error encountered while scanning for media.', this.filePattern, err.message);
    })
    .map((file) => this.resolvePath(file), {
      concurrency: 3
    })
    .then((files) => {
      this.files = files;
      return this.files;
    });
  }

  transcodeAll() {
    return this._ready
    .then(() => {
      if (!this.isReady) {
        throw new TranscodeError('Batch has already been processed.', this.filePattern);
      }
      this.startTime = Date.now();
      this.lastTime = this.startTime;
      this.status = BatchTranscodeVideo.RUNNING;
      return this.files;
    })
    .mapSeries((video, index) => {
      this.lastTime = Date.now();
      this.currentIndex = index;
      return video.transcode();
    })
    .then(() => {
      this.lastTime = Date.now();
      this.stopTime = this.lastTime;
      this.status = BatchTranscodeVideo.FINISHED;
      this.currentIndex = -1;
      let errored = this.files.reduce((t, file) => t + (file.isErrored ? 1 : 0), 0);
      if (errored > 0) {
        this.status = BatchTranscodeVideo.ERRORED;
      }
    })
    .catch((err) => {
      this.lastTime = Date.now();
      this.stopTime = this.lastTime;
      this.status = BatchTranscodeVideo.ERRORED;
      this.error = err;
      throw err;
    });
  }

  resolvePath(filePath) {
    return stat(filePath)
    .then((stats) => {
      return new VideoFile(filePath, stats, this.options, this.transcodeOptions, () => this.estimateSpeed());
    });
  }

  estimateSpeed() {
    let processed = sumFileSizes(this.files.slice(0, this.currentIndex), 'lastPercent');
    if (processed > 0) {
      // ms/MB
      return (this.lastTime - this.startTime) / processed;
    }
    return null;
  }

  get processedFileSizes() {
    return sumFileSizes(this.files);
  }

  get totalFileSizes() {
    return this.files
    .reduce(function (total, file) {
      let useSize = file.fileSize;
      if (file.isErrored) {
        useSize *= file.currentPercent;
      } else if (file.isSkipped) {
        useSize = 0;
      }
      return total + useSize;
    }, 0);
  }

  get currentPercent() {
    return this.processedFileSizes / this.totalFileSizes;
  }

  get currentTime() {
    return (this.isRunning ? Date.now() : this.stopTime) - this.startTime;
  }

  get totalTime() {
    return this.isRunning ? (this.currentTime / this.currentPercent) : (this.stopTime - this.startTime);
  }

  get remainingTime() {
    return Math.max(this.totalTime - this.currentTime, 0);
  }

  get isReady() {
    return this.status === BatchTranscodeVideo.INACTIVE;
  }

  get isRunning() {
    return this.status === BatchTranscodeVideo.RUNNING;
  }

  get isDone() {
    return this.isFinished || this.isErrored;
  }

  get isFinished() {
    return this.status === BatchTranscodeVideo.FINISHED;
  }

  get isErrored() {
    return this.status === BatchTranscodeVideo.ERRORED;
  }

  get ready() {
    return this._ready;
  }

  get currentFile() {
    if (this.currentIndex >= 0) {
      return this.files[this.currentIndex];
    }
    return null;
  }
};
