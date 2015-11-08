import Promise from 'bluebird';
import BatchTranscodeVideo from './index.js';
import Progress from './lib/progress.js';
import help from './lib/help.js';
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
    this.progress = new Progress(this.charm, CliBatchTranscodeVideo.FIRST_TAB, this.options['quiet']);
    ChildPromise.debug = this.options['debug'];
    return this;
  }

  cli() {
    process.on('uncaughtException', (err) => {
      this.error = err;
      this.onError(err);
    });
    process.on('exit', () => {
      if (this.files && this.files.length) {
        for (let file of this.files) {
          try {
            if (file._encode !== null) {
              file._encode.kill();
            }
          } catch (e) {}
        }
      }
      this.finish();
    });
    this.progress.start();

    if (this.options['debug'] !== true && this.options['quiet'] !== true) {
      this.progress.write(this.state());
      this.timer = setInterval(() => {
        this.progress.clear();
        this.progress.write(this.state());
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
    // this.progress.clear();
    this.progress.finish();
    this.progress.summary(this.finalState());
    if (!this.isSuccess) {
      process.reallyExit(1);
    }
  }

  finalState() {
    let processed = this.processedFileSizes;
    let total = this.totalFileSizes;
    // TODO: Not sure if this is working correctly
    let speed = processed / (this.totalTime / 1000.0);
    return {
      files: this.files,
      processed: processed.toFixed(2),
      total: total.toFixed(2),
      speed: speed.toFixed(2),
      success: this.isFinished,
      error: this.error
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
