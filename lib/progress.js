import {millisecondsToStr as ms2Str, fractionToPercent as f2Percent} from './util.js';

export default class Progress {
  constructor(charm, firstTab) {
    this.charm = charm;
    this.firstTab = firstTab;
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
      // for (let type of Object.keys(this.counts)) {
      //   let total = this.counts[type];
      //   if (total > 0) {
      //     this.bulletPoint(`${total} file${total !== 1 ? 's' : ''} ${type}.`, this.color[type], this.bold[type]);
      //   }
      // }
      this.charm.write(`\n`);
      this.colorBar(`Summary`, this.counts, `${state.files.length} file${state.files.length !== 1 ? 's' : ''}`);
      this.truncatedLine('Processed', `${state.processed} MB of ${state.total} total MB`);
      this.charm.write(`\n`);
      // this.bulletPoint(`Processed ${state.processed} MB of ${state.total} total MB across ${state.files.length} file${state.files.length !== 1 ? 's' : ''}.`, 'cyan');
      let finalMsg = state.success ?  `Finished without error.` :  `Finished with errors.`;
      this.bulletPoint(finalMsg, (state.success ? 'green' : 'red'), true, '=>');
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

  bulletPoint(line, color, bold = false, dash = '-') {
    this.charm
    .display(bold ? 'bright' : 'reset')
    .foreground(color)
    .write(` ${dash} ${line}\n`);
  }

  truncatedLine(label, str = '', extra = '', size = 0.5, labelLen = 8) {
    let firstPad = ' '.repeat(this.firstTab);
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
    let uncolored = (100.0 * size) - colored;
    this.charm
    .display('bright')
    .foreground('blue')
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
    let types = Object.keys(counts);
    let totalCount = types.reduce((total, type) => {
      return total + counts[type];
    }, 0);
    this.charm
    .display('bright')
    .foreground('blue')
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
    this.charm.up(6).erase('line').erase('down').write('\r');
  }
};
