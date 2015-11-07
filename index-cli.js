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
    process.on('exit', () => this.finish());
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
    this.progress.clear();
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
      success: this.isSuccess
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
    this.counts = {
      skipped: 0,
      written: 0,
      errored: 0,
      queued: 0
    };
    this.color = {
      skipped: 'blue',
      written: 'green',
      errored: 'red',
      queued: 'yellow'
    };
    this.bold = {
      skipped: false,
      written: false,
      errored: true,
      queued: true
    };
  }

  start() {
    this.charm
    .display('bright')
    .foreground('cyan')
    .write('Starting batch operation...\n\n');
  }

  finish() {
    this.charm
    .display('bright')
    .foreground('cyan')
    .write('Finished processing.\n\n');
  }

  summary(state) {
    try {
      for (let file of state.files) {
        let type;
        if (file.isWritten) {
          type = 'written';
        } else if (file.isErrored || file.isRunning) {
          type = 'errored';
        } else if (file.isReady) {
          type = 'queued';
        } else {
          type = 'skipped'
        }
        this.counts[type] += 1;
        this.bulletPoint(`${this.labelPad(`${type.toUpperCase()}: `, 10)}${this.truncateStr(file.fileName, 0.75, 10)}`, this.color[type], this.bold[type]);
      }
      for (let type of Object.keys(this.counts)) {
        let total = this.counts[type];
        if (total > 0) {
          this.bulletPoint(`${total} file${total !== 1 ? 's' : ''} ${type}.`, this.color[type], this.bold[type]);
        }
      }
      this.bulletPoint(`Processed ${state.processed} MB of ${state.total} total MB across ${state.files.length} file${state.files.length !== 1 ? 's' : ''}.`, 'cyan');
      let finalMsg = state.success ?  `Finished without error.` :  `Finished with errors.`;
      this.bulletPoint(finalMsg, (state.success ? 'green' : 'red'), true);
    } catch (e) {
      console.log(e.message);
      console.log(e.stack);
    }
  }

  write(state) {
    let cur = state.current;
    let total = state.total;
    this.bar(`Current`, cur.percent);
    this.truncatedLine('File', cur.file, ms2Str(cur.remaining));
    this.charm.write(`\n`);
    this.bar(`Total`, total.percent);
    this.truncatedLine('Status', total.status, ms2Str(total.remaining));
    this.charm.write(`\n`);
  }

  bulletPoint(line, color, bold = false) {
    this.charm
    .display(bold ? 'bright' : 'reset')
    .foreground(color)
    .write(` - ${line}\n`);
  }

  truncatedLine(label, str = '', extra = '', size = 0.5, labelLen = 8) {
    let firstPad = ' '.repeat(CliBatchTranscodeVideo.FIRST_TAB);
    let formatted = this.truncateStr(str, size, labelLen);
    this.charm
    .foreground('blue')
    .write(`${firstPad}${this.labelPad(`${label}: `, labelLen)}`)
    .display('reset')
    .foreground('white')
    .write(`${formatted}`)
    .foreground('yellow')
    .write(`  ${extra}\n`);
  }

  truncateStr(str, size = 0.5, labelLen = 8) {
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
    return formatted;
  }

  labelPad(label, pad = 8) {
    return label.length < pad ? label + (' '.repeat(pad - label.length)) : label;
  }

  bar(label, percent, size = 0.5) {
    let printPercent = f2Percent(percent);
    let colored = Math.round(Number.parseFloat(printPercent) * size);
    let uncolored = (100 * size) - colored;
    this.charm
    .display('bright')
    .foreground('blue')
    .write(this.labelPad(`${label}: `, CliBatchTranscodeVideo.FIRST_TAB))
    .display('reset')
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
