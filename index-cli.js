import Promise from 'bluebird';
import BatchTranscodeVideo from './index.js';
import _charm from 'charm';
import {millisecondsToStr as ms2Str, fractionToPercent as f2Percent} from './lib/util.js';

export default class CliBatchTranscodeVideo extends BatchTranscodeVideo {
  static get INTERVAL_MS() { return 1000; }
  constructor(options, transcodeOptions) {
    super(options, transcodeOptions);
    this.progress = null;
    this.charm = _charm(process);
    return this;
  }

  cli() {
    process.on('exit', () => this.finish());
    return this.startProgress()
    .then(() => this.transcodeAll())
    .then(res => this.onSuccess(res))
    .catch(err => this.onError(err));
  }

  startProgress() {
    this.charm
    .write('Starting batch operation...\n\n');

    this.write();
    this.progress = setInterval(() => {
      this.clear();
      this.write();
    }, CliBatchTranscodeVideo.INTERVAL_MS);
    return Promise.resolve(true);
  }

  stopProgress() {
    if (this.progress !== null) {
      clearInterval(this.progress);
      this.progress = null;
    }
    return Promise.resolve(true);
  }

  printSummary() {
    this.charm
    .write('\n\nFinished processing.');
    return true;
  }

  finish() {
    return this.stopProgress()
    .then(() => this.printSummary())
    .then(() => {
      if (!this.isSuccess) {
        process.reallyExit(1);
      }
    });
  }

  write() {
    let currentFile = '(Spinning up, please wait...)';
    let totalProg = 0, totalCTime = 0, totalTTime = 0;
    let fileProg = 0, fileCTime = 0, fileTTime = 0;
    if (this.isRunning) {
      currentFile = this.currentFile.fileName;
      totalProg = this.currentPercent;
      totalCTime = this.currentTime;
      totalTTime = this.remainingTime;
      fileProg = this.currentFile.currentPercent;
      fileCTime = this.currentFile.currentTime;
      fileTTime = this.currentFile.remainingTime;
    }
    this.charm
    .write(`Current: ${currentFile}\n`)
    .write(`\t${f2Percent(fileProg)}%\t\tElapsed: ${ms2Str(fileCTime)}\tRemaining: ${ms2Str(fileTTime)}\n`)
    .write(`\t${f2Percent(totalProg)}%\t\tElapsed: ${ms2Str(totalCTime)}\tRemaining: ${ms2Str(totalTTime)}\n\n`);
  }

  clear() {
    this.charm.up(4).erase('line').erase('down').write("\r");
  }

  onSuccess(result) {
    process.exit(0);
  }

  onError(err) {
    process.exit(1);
  }
};

// console.log('- Starting batch operation...');
// say.notify('Scanning for media using search pattern.', say.DEBUG, filePattern);
