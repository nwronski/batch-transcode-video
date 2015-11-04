import {isFunction} from './util.js';
import Promise from 'bluebird';
import {spawn, exec} from 'child_process';
import TranscodeError from './transcode-error.js';

function windowsCommand(cmd, args) {
  return [cmd].concat(args.map(function (arg) {
    return /^[^\-]/.test(arg) ? '"' + arg + '"' : arg;
  })).join(' ');
}

export default class ChildPromise {

  constructor(options, childOptions) {
    // cmd, args, file, dir, mute, callback
    this.options = Object.assign({
      fileName: '',
      cmd: '',
      args: [],
      cwd: '.',
      isWindows: /^win/i.test(process.platform),
      onData: function () {},
      onError: function () {}
    }, options);
    this.childOptions = Object.assign({
      cwd: this.options.cwd
    }, childOptions);

    this.stdout = '';
    this.stderr = '';

    return this;
  }

  start() {
    this._promise = new Promise((a, r) => {
      this._accept = a;
      this._reject = r;
      let {cmd, args, isWindows} = this.options;
      this._child = isWindows ?
          // Use exec() and special escape syntax for Windows
          exec(windowsCommand(cmd, args), this.childOptions) :
          // Use spawn() and normal syntax for non-Windows
          spawn(cmd, args, this.childOptions);

      this._child.stdout.on('data', data => this.dataHandler(data));
      this._child.stderr.on('data', data => this.stdErrHandler(data));
      this._child.on('close', code => this.closeHandler(code));
      this._child.on('error', err => this.errHandler(err));
    });

    return this.promise;
  }

  dataHandler(buffer) {
    let data = buffer.toString().trim();
    // Only keep the last packet of data to prevent large
    // amount of output being saved in memory
    this.stdout = !/\n/.test(data) ? this.stdout + data : data;
    this.options.onData(data);
  }

  stdErrHandler(buffer) {
    let data = buffer.toString();
    this.stderr += data;
    this.options.onError(data);
  }

  errHandler(err) {
    let additional = err.toString().trim();
    this._reject(new TranscodeError('Child process encountered an error.', this.options.fileName, additional));
  }

  closeHandler(code) {
    if (code !== 0) {
      this.errHandler(this.stderr);
    } else {
      this._accept(this.stdout);
    }
  }

  get promise() {
    return this._promise;
  }

  get child() {
    return this._child;
  }
};
