import Promise from 'bluebird';
import {unlinkSync} from 'fs';
import BatchTranscodeVideo from './index.js';
import Progress from './lib/progress.js';
import help from './lib/help.js';
import VideoFile from './lib/video-file.js';
import _charm from 'charm';
import ChildPromise from './lib/child-promise.js';

export default class CliBatchTranscodeVideo extends BatchTranscodeVideo {
  static get INTERVAL_MS() { return 1000; }
  static get FIRST_TAB() { return 10; }
  constructor(options, transcodeOptions) {
    super(options, transcodeOptions);
    this.timer = null;
    this.files = [];
    this.charm = _charm(process);
    if (this.options['help'] === true) {
      help(this.charm);
      process.exit(0);
    }
    this.progress = new Progress(this.charm, CliBatchTranscodeVideo.FIRST_TAB);
    ChildPromise.debug = this.options['debug'];
    return this;
  }

  cli() {
    process.on('uncaughtException', (err) => {
      this.error = err;
      this.onError(err);
    });
    process.on('exit', () => {
      if (!this.isFinished) {
        this.status = BatchTranscodeVideo.ERRORED;
      }
      if (this.files && this.files.length) {
        for (let file of this.files) {
          try {
            if (file._encode !== null) {
              file._encode.kill();
            }
            // Handle SIGINT
            if (file.isRunning) {
              file.status = VideoFile.ERRORED;
            }
            if (file.isErrored) {
              // Try and delete the destination file if it exists
              unlinkSync(file.destFilePath);
            }
          } catch (e) {}
        }
      }
      this.finish();
    });

    if (this.options['quiet'] !== true) {
      this.progress.start();
    }

    if (this.options['debug'] !== true && this.options['quiet'] !== true) {
      this.progress.write(this.state());
      this.timer = setInterval(() => {
        let state = this.state();
        this.progress.clear();
        this.progress.write(state);
      }, CliBatchTranscodeVideo.INTERVAL_MS);
    }

    return this.transcodeAll()
    .then(res => this.onSuccess(res))
    .catch(err => this.onError(err));
  }

  finish() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.options['quiet'] !== true) {
      // this.progress.clear();
      this.progress.finish();
      this.progress.summary(this.finalState());
    }
    if (!this.isSuccess) {
      process.reallyExit(1);
    }
  }

  finalState() {
    let processed = this.processedFileSizes;
    let total = this.totalFileSizes;
    let seconds = this.totalTime / 1000.0;
    let speed = processed / seconds;
    let workCount = this.files.reduce((t, file) => {
      return t + file.currentPercent;
    }, 0);
    let average = workCount > 0 ? (this.totalTime / workCount) : 0;
    return {
      files: this.files,
      processed: processed.toFixed(2),
      total: total.toFixed(2),
      speed: speed.toFixed(2),
      success: this.isFinished,
      error: this.error,
      elapsed: this.totalTime,
      average
    };
  }

  state() {
    try {
      let processed = this.processedFileSizes;
      let remaining = this.totalFileSizes.toFixed(2);
      return {
        current: {
          file: this.currentFile.fileName,
          percent: this.currentFile.currentPercent,
          elapsed: this.currentFile.currentTime,
          remaining: this.currentFile.remainingTime
        },
        total: {
          percent: this.currentPercent,
          elapsed: this.currentTime,
          remaining: this.remainingTime,
          processed: `${processed > 0 ? processed.toFixed(2) : '(estimating)'} MB of ${remaining} MB`,
          files: this.files
        }
      };
    } catch (e) {
      return {
        current: {
          file: `[Scanning ${this.files.length} files...]`,
          percent: 0,
          elapsed: 0,
          remaining: 0
        },
        total: {
          percent: 0,
          elapsed: 0,
          remaining: 0,
          status: '[Calculating remaining time...]'
        }
      };
    }
  }

  onSuccess(result) {
    process.exit(0);
  }

  onError(err) {
    process.exit(1);
  }
};
