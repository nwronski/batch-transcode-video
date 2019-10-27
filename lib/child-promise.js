import {isFunction} from './util.js';
import Promise from 'bluebird';
import spawn from 'cross-spawn-async';
import TranscodeError from './transcode-error.js';
let _debug = false;

export default class ChildPromise {
  static get debug() { return _debug; }
  static set debug(val) { _debug = val; }
  constructor(options, childOptions) {
    this.options = Object.assign({
      fileName: '',
      cmd: '',
      args: [],
      cwd: '.',
      onData: function () {},
      onError: function () {},
      // Note: Had to mute stderr to prevent false positive errors
      muted: true
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
      let {cmd, args} = this.options;

      this._child = spawn(cmd, args, this.childOptions);

      this._child.stdout.on('data', data => this.dataHandler(data));
      this._child.stderr.on('data', data => this.stdErrHandler(data));
      this._child.on('close', code => this.closeHandler(code));
      this._child.on('error', err => this.errHandler(err));
    });

    return this.promise;
  }

  dataHandler(buffer) {
    let data = buffer.toString().trim();
    this.stdout += data;
    this.options.onData(data);
    if (ChildPromise.debug) {
      console.log(`stdio: ${data}`);
    }
  }

  stdErrHandler(buffer) {
    let data = buffer.toString();
    this.stderr += data;
    this.options.onError(data);
    if (ChildPromise.debug) {
      console.log(`stderr: ${data}`);
    }
  }

  errHandler(err) {
    let additional = err.toString().trim();
    this._reject(new TranscodeError('Child process encountered an error.', this.options.fileName, additional));
  }

  closeHandler(code) {
    if (code !== 0 && this.options.muted !== true) {
      this.errHandler(this.stderr);
    } else {
      this._accept(this.stdout);
    }
  }

  kill() {
    try {
      this._child.kill();
    } catch (e) {}
  }

  get promise() {
    return this._promise;
  }

  get child() {
    return this._child;
  }
};
