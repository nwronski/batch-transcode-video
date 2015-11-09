import {millisecondsToStr as ms2Str, fractionToPercent as f2Percent} from './util.js';

export default class Progress {
  constructor(charm, firstTab) {
    this.charm = charm;
    this.firstTab = firstTab;
    this.firstPad = ' '.repeat(this.firstTab);
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
    .write('\nStarting batch operation...')
    .display('reset')
    .write('\n\n');
  }

  finish() {
    this.charm
    .display('bright')
    .foreground('cyan')
    .write('Finished processing.')
    .display('reset')
    .write('\n\n');
  }

  summary(state) {
    if (state.error !== null) {
      this.charm
      .display('reset')
      .foreground('white')
      .write(`\n${state.error}\n`);
    }
    let counts = Progress.getCounts(state.files, true);
    for (let file of state.files) {
      let type = Progress.getStatusName(file, true);
      let bitrate = file.encodeBitrate !== null ? ` (${file.encodeBitrate})` : '';
      this.bulletPoint(`${Progress.labelPad(`${type.toUpperCase()}: `, 10)}${Progress.truncateStr(file.fileName, 0.5, 0)}${bitrate}`, this.color[type], this.bold[type]);
      if (file.error !== null) {
        // Print error message
        this.charm
        .display('reset')
        .foreground('white')
        .write(`${file.error}\n`);
      }
    }
    this.charm.write(`\n`);
    this.colorBar(`Summary`, counts, `${state.files.length} file${state.files.length !== 1 ? 's' : ''}`);
    this.fileStatusLine(counts);
    this.truncatedLine('Processed', `${state.processed} MB of ${state.total} total MB`, `${state.speed} MB/s`);
    this.truncatedLine('Time', `Total ${ms2Str(state.elapsed)} (Avg: ${ms2Str(state.average)})`);
    this.charm.write(`\n`);
    let finalMsg = state.success ?  `Finished without error.` :  `Finished with errors.`;
    this.bulletPoint(finalMsg, (state.success ? 'green' : 'red'), true, '=>');
    this.charm.display('reset').write(`\n`);
  }

  write(state) {
    let cur = state.current;
    let total = state.total;
    let counts = Progress.getCounts(total.files, false);
    this.bar(`Current`, cur.percent);
    this.truncatedLine('File', cur.file, ms2Str(cur.remaining));
    this.charm.write(`\n`);
    this.bar(`Total`, total.percent);
    this.truncatedLine('Processed', total.processed, ms2Str(total.remaining));
    this.fileStatusLine(counts);
    this.charm.display('reset').write(`\n`);
  }

  fileStatusLine(counts) {
    this.charm
    .display('reset')
    .foreground('cyan')
    .write(`${this.firstPad}${Progress.labelPad(`Status: `)}`);
    counts['queued'] = Math.max(counts['queued'] - 1, 0);
    for (let type of Object.keys(counts).filter(c => counts[c] > 0)) {
      this.charm
      .display('reset')
      .display('bright')
      .foreground(this.color[type])
      .write(`${type.slice(0, 2).toUpperCase()}: `)
      .display('reset')
      .write(`${counts[type]}  `);
    }
    this.charm.display('reset').write('\n');
  }

  bulletPoint(line, color, bold = false, dash = '-') {
    this.charm
    .display(bold ? 'bright' : 'reset')
    .foreground(color)
    .write(` ${dash} ${line}\n`);
  }

  truncatedLine(label, str = '', extra = '', size = 0.5, labelLen = 8) {
    labelLen = Math.max(labelLen, label.length + 2);
    let formatted = Progress.truncateStr(str, size, labelLen);
    this.charm
    .display('reset')
    .foreground('cyan')
    .write(`${this.firstPad}${Progress.labelPad(`${label}: `, labelLen)}`)
    .display('reset')
    .foreground('white')
    .write(`${formatted}`)
    .foreground('yellow')
    .write(`  ${extra}\n`);
  }

  bar(label, percent, size = 0.5) {
    let printPercent = f2Percent(percent);
    let colored = Math.round(Number.parseFloat(printPercent) * size);
    let uncolored = (100.0 * size) - colored;
    this.charm
    .display('bright')
    .foreground('cyan')
    .write(Progress.labelPad(`${label}: `, this.firstTab))
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

  colorBar(label, counts, extra = '', size = 0.5) {
    let types = Object.keys(counts).filter((key) => counts[key] > 0);
    let totalCount = types.reduce((total, type) => {
      return total + counts[type];
    }, 0);
    this.charm
    .display('bright')
    .foreground('cyan')
    .write(Progress.labelPad(`${label}: `, this.firstTab));
    let total = 100.0 * size;
    if (types.length !== 0) {
      for (let type of types) {
        let percent = counts[type] / totalCount;
        let printPercent = f2Percent(percent);
        let colored = Math.round(Number.parseFloat(printPercent) * size);
        if (type === types.slice(-1)[0]) {
          colored = total;
        }
        total -= colored;
        this.charm
        .display('reset')
        .background(this.color[type])
        .write(' '.repeat(colored));
      }
    } else {
      this.charm
      .display('reset')
      .background('black')
      .write(' '.repeat(total));
    }
    this.charm
    .display('reset')
    .display('bright')
    .write(`  ${extra}\n`);
  }

  clear() {
    this.charm.up(7).erase('line').erase('down').write('\r');
  }

  static getCounts(files = [], done = false) {
    let counts = {
      written: 0,
      errored: 0,
      skipped: 0,
      queued: 0
    };
    files.forEach((file) => {
      let type = Progress.getStatusName(file, done);
      counts[type] += 1;
    });
    return counts;
  }

  static getStatusName(file, done = false) {
    let type;
    if (file.isWritten) {
      type = 'written';
    } else if (file.isErrored || (done && file.isRunning)) {
      type = 'errored';
    } else if (file.isSkipped) {
      type = 'skipped'
    } else if (file.isReady || (!done && file.isRunning)) {
      type = 'queued';
    }
    return type;
  }

  static truncateStr(str, size = 0.5, labelLen = 8) {
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

  static labelPad(label, pad = 8) {
    return label.length < pad ? label + (' '.repeat(pad - label.length)) : label;
  }
};
