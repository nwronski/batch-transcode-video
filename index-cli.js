import Promise from 'bluebird';
import BatchTranscodeVideo from './index.js';
import _charm from 'charm';
import {millisecondsToStr as ms2Str, fractionToPercent as f2Percent} from './lib/util.js';

export default class CliBatchTranscodeVideo extends BatchTranscodeVideo {
  static get INTERVAL_MS() { return 1000; }
  constructor(options, transcodeOptions) {
    super(options, transcodeOptions);
    this.timer = null;
    this.progress = new Progress(_charm(process));
    return this;
  }

  cli() {
    process.on('exit', () => this.progress.finish());
    this.progress.start();

    this.progress.write(this.state());
    this.timer = setInterval(() => {
      this.progress.clear();
      this.progress.write(this.state());
    }, CliBatchTranscodeVideo.INTERVAL_MS);

    return this.transcodeAll()
    .then(res => this.onSuccess(res))
    .catch(err => this.onError(err));
  }

  finish() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.progress.finish();
    if (!this.isSuccess) {
      process.reallyExit(1);
    }
  }

  state() {
    try {
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
          remaining: this.remainingTime
        }
      };
    } catch (e) {
      return {
        current: {
          file: '[Calculating remaining time, please wait...]',
          percent: 0,
          elapsed: 0,
          remaining: 0
        },
        total: {
          percent: 0,
          elapsed: 0,
          remaining: 0
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

class Progress {
  constructor(charm) {
    this.charm = charm;
  }

  start() {
    this.charm
    .write('Starting batch operation...\n\n');
  }

  finish() {
    this.charm
    .write('\n\nFinished processing.');
  }

  write(state) {
    let cur = state.current;
    let total = state.total;
    this.bar(cur.percent);
    this.charm
    .display('reset')
    // TODO: Add ellipsis to file name over certain size
    .write(`\tFile: ${cur.file}\n`)
    .write(`Current\t${f2Percent(cur.percent)}%\t\tElapsed: ${ms2Str(cur.elapsed)}\tRemaining: ${ms2Str(cur.remaining)}\n`)
    .write(`Total\t${f2Percent(total.percent)}%\t\tElapsed: ${ms2Str(total.elapsed)}\tRemaining: ${ms2Str(total.remaining)}\n\n`);
  }

  bar(percent, size = 0.5) {
    let printPercent = f2Percent(percent);
    let colored = Math.round(Number.parseFloat(printPercent) * size);
    let uncolored = (100 * size) - colored;
    this.charm
    .display('reset')
    .write(`\t`)
    .background('cyan')
    .write(' '.repeat(colored))
    .display('reset')
    .background('black')
    .write(' '.repeat(uncolored))
    .display('reset')
    .display('bright')
    .write(`\t${printPercent}%\n`);
  }

  clear() {
    this.charm.up(5).erase('line').erase('down').write('\r');
  }
}

// console.log('- Starting batch operation...');
// say.notify('Scanning for media using search pattern.', say.DEBUG, filePattern);
