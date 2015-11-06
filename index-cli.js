import Promise from 'bluebird';
import BatchTranscodeVideo from './index.js';
import _charm from 'charm';
import {millisecondsToStr as ms2Str, fractionToPercent as f2Percent} from './lib/util.js';

export default class CliBatchTranscodeVideo extends BatchTranscodeVideo {
  static get INTERVAL_MS() { return 1000; }
  static get FIRST_TAB() { return 10; }
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
          status: `${processed > 0 ? processed.toFixed(2) : '(estimating)'} MB of ${remaining} MB`
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

class Progress {
  constructor(charm) {
    this.charm = charm;
  }

  start() {
    this.charm
    .display('reset')
    .write('Starting batch operation...\n\n');
  }

  finish() {
    this.charm
    .display('reset')
    .write('\nFinished processing.\n\n');
  }

  write(state) {
    let cur = state.current;
    let total = state.total;
    this.bar(`Current`, cur.percent);
    this.truncatedLine('File', cur.file, `Left: ${ms2Str(cur.remaining)}`);
    // this.statusLine({label: 'Current', elapsed: cur.elapsed, remaining: cur.remaining});
    this.charm.write(`\n`);
    this.bar(`Total`, total.percent);
    // this.statusLine({label: 'Total', elapsed: total.elapsed, remaining: total.remaining});
    this.truncatedLine('Status', total.status, `Left: ${ms2Str(total.remaining)}`);
    this.charm.write(`\n`);
  }

  truncatedLine(label, str = '', extra = '', size = 0.5) {
    let firstPad = ' '.repeat(CliBatchTranscodeVideo.FIRST_TAB);
    let labelLen = 8;
    let maxLen = 100.0 * size;
    let maxWithoutLabel = maxLen - labelLen;
    let formatted;
    if (str.length > maxWithoutLabel) {
      let frontStr = str.slice(0, maxWithoutLabel - 13);
      let endStr = str.slice(-10);
      formatted = `${frontStr}...${endStr}`;
    } else {
      let paddingSize = maxWithoutLabel - str.length;
      let padding = ' '.repeat(paddingSize);
      formatted = `${str}${padding}`;
    }
    this.charm
    .display('reset')
    .write(`${firstPad}${this.labelPad(`${label}: `, labelLen)}${formatted}  ${extra}\n`);
  }

  labelPad(label, pad = 8) {
    return label.length < pad ? label + (' '.repeat(pad - label.length)) : label;
  }

  statusLine({label, elapsed, remaining}) {
    this.charm
    .display('reset')
    .write(`${this.labelPad(`${label}: `, 12)}Elapsed: ${ms2Str(elapsed)}\tRemaining: ${ms2Str(remaining)}\n`);
  }

  bar(label, percent, size = 0.5) {
    let printPercent = f2Percent(percent);
    let colored = Math.round(Number.parseFloat(printPercent) * size);
    let uncolored = (100 * size) - colored;
    this.charm
    .display('reset')
    .write(this.labelPad(`${label}: `, CliBatchTranscodeVideo.FIRST_TAB))
    .background('cyan')
    .write(' '.repeat(colored))
    .display('reset')
    .background('black')
    .write(' '.repeat(uncolored))
    .display('reset')
    .display('bright')
    .write(`  ${printPercent}%\n`);
  }

  clear() {
    this.charm.up(6).erase('line').erase('down').write('\r');
  }
};
