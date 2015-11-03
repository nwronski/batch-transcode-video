import Promise from 'bluebird';
import _glob from 'glob';
let glob = Promise.promisify(_glob);
import {stat as _stat} from 'fs';
let stat = Promise.promisify(_stat);
import TranscodeError from './lib/transcode-error.js';
import VideoFile from './lib/video-file.js';

export default class BatchTranscodeVideo {
  static get INACTIVE() { return 0; }
  static get RUNNING() { return 1; }
  static get FINISHED() { return 2; }
  static get ERRORED() { return 3; }

  constructor(filePattern, options) {
    this.filePattern = filePattern;
    this.options = options;
    this.status = BatchTranscodeVideo.INACTIVE;
    this.files = new Set();
    this._ready = this.createEntries();
    return this;
  }

  createEntries() {
    return glob(this.filePattern, {})
    .then((files) => {
      if (files.length === 0) {
        throw new TranscodeError('No files found for search pattern provided.', filePattern);
      }
      return files;
    }, (err) => {
      throw new TranscodeError('File system error encountered while scanning for media.', filePattern, err.message);
    })
    .map((file) => this.resolvePath(file), {
      concurrency: 3
    })
    .map((entry) => {
      this.files.add(entry);
    })
    .then(() => this.files);
  }

  transcodeAll() {
    return this._ready
    .then(() => {
      this.status = BatchTranscodeVideo.RUNNING;
      return this.files;
    })
    .mapSeries((video) => {
      this.currentFile = video;
      return this.currentFile.transcode();
    })
    .then(() => {
      this.status = BatchTranscodeVideo.FINISHED;
      this.currentFile = null;
    })
    .catch((err) => {
      this.status = BatchTranscodeVideo.ERRORED;
      throw err;
    });
  }

  resolvePath(filePath) {
    return stat(filePath)
    .then((stats) => {
      return new VideoFile(filePath, stats, this.options);
    });
  }

  get ready() {
    return this._ready;
  }

  // get currentFile() {
  //   for (let video of this.files) {
  //     if (video.isRunning) {
  //       return video;
  //     }
  //   }
  //   return null;
  // }
};
