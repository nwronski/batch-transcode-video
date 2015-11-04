import Promise from 'bluebird';
import BatchTranscodeVideo from './index.js';
import _charm from 'charm';
import {millisecondsToStr as ms2Str} from './lib/util.js';

export default class CliBatchTranscodeVideo extends BatchTranscodeVideo {
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
      // this.clear();
      // this.write();
    }, 1000);
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
    console.log("WE DONE");
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
    let currentFile = '(Please wait...)';
    let totalProg = 0, totalCTime = 0, totalTTime = 0;
    let fileProg = 0, fileCTime = 0, fileTTime = 0;
    if (this.isRunning) {
      let currentFile = this.currentFile.fileName;
      let totalProg = this.currentPercent;
      let totalCTime = ms2Str(this.currentTime);
      let totalTTime = ms2Str(this.totalTime);
      let fileProg = this.currentFile.currentPercent;
      let fileCTime = ms2Str(this.currentFile.currentTime);
      let fileTTime = ms2Str(this.currentFile.totalTime);
    }
    this.charm
    .write(`Current: ${currentFile}\n`)
    .write(`\t${fileProg}%\tElapsed: ${ms2Str(fileCTime)}\tRemaining: ${ms2Str(fileTTime)}\n`)
    .write(`\t${totalProg}%\tElapsed: ${ms2Str(totalCTime)}\tRemaining: ${ms2Str(totalTTime)}`);
  }

  clear() {
    // this.charm.up(2).erase('line').erase('down').write("\r");
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
