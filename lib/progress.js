import {millisecondsToStr as ms2Str, fractionToPercent as f2Percent} from './util.js';

export default class Progress {
  constructor(charm, firstTab, quiet = false) {
    this.charm = charm;
    this.firstTab = firstTab;
    this.firstPad = ' '.repeat(this.firstTab);
    this.quiet = quiet;
    this.color = {
      skipped: 'cyan',
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
    if (this.quiet === true) {
      return false;
    }
    this.charm
    .display('bright')
    .foreground('cyan')
    .write('Starting batch operation...')
    .display('reset')
    .write('\n\n');
  }

  finish() {
    if (this.quiet === true) {
      return false;
    }
    this.charm
    .display('bright')
    .foreground('cyan')
    .write('Finished processing.')
    .display('reset')
    .write('\n\n');
  }

  getCounts(files = [], done = false) {
    let counts = {
      written: 0,
      errored: 0,
      skipped: 0,
      queued: 0
    };
    files.forEach((file) => {
      let type = this.getStatusName(file, done);
      counts[type] += 1;
    });
    return counts;
  }

  getStatusName(file, done = false) {
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

  summary(state) {
    if (this.quiet === true) {
      return false;
    }
    if (state.error !== null) {
      this.charm
      .display('reset')
      .foreground('white')
      .write(`\n${state.error}\n`);
    }
    let counts = this.getCounts(state.files, true);
    for (let file of state.files) {
      let type = this.getStatusName(file, true);
      this.bulletPoint(`${this.labelPad(`${type.toUpperCase()}: `, 10)}${this.truncateStr(file.fileName, 0.75, 10)}`, this.color[type], this.bold[type]);
      if (file.error !== null) {
        // Print error message
        this.charm
        .display('reset')
        .write(`${file.error}\n`);
      }
    }
    this.charm.write(`\n`);
    this.colorBar(`Summary`, counts, `${state.files.length} file${state.files.length !== 1 ? 's' : ''}`);
    this.truncatedLine('Processed', `${state.processed} MB of ${state.total} total MB`);
    this.charm.write(`\n`);
    // this.bulletPoint(`Processed ${state.processed} MB of ${state.total} total MB across ${state.files.length} file${state.files.length !== 1 ? 's' : ''}.`, 'cyan');
    let finalMsg = state.success ?  `Finished without error.` :  `Finished with errors.`;
    this.bulletPoint(finalMsg, (state.success ? 'green' : 'red'), true, '=>');
    this.charm.display('reset').write(`\n`);
  }

  write(state) {
    if (this.quiet === true) {
      return false;
    }
    let cur = state.current;
    let total = state.total;
    let counts = this.getCounts(total.files, false);
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
    .write(`${this.firstPad}${this.labelPad(`Status: `)}`);
    counts['queued'] = Math.max(counts['queued'] - 1, 0);
    for (let type of Object.keys(counts)) {
      this.charm
      .display('reset')
      .display('bright')
      .foreground(this.color[type])
      .write(`${type[0].toUpperCase()}: `)
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
    let formatted = this.truncateStr(str, size, labelLen);
    this.charm
    .display('reset')
    .foreground('cyan')
    .write(`${this.firstPad}${this.labelPad(`${label}: `, labelLen)}`)
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
    let uncolored = (100.0 * size) - colored;
    this.charm
    .display('bright')
    .foreground('cyan')
    .write(this.labelPad(`${label}: `, this.firstTab))
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
    .write(this.labelPad(`${label}: `, this.firstTab));
    let total = 100.0 * size;
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
    this.charm
    .display('reset')
    .display('bright')
    .write(`  ${extra}\n`);
  }

  clear() {
    this.charm.up(7).erase('line').erase('down').write('\r');
  }
};
