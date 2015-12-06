'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require('./util.js');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _crossSpawnAsync = require('cross-spawn-async');

var _crossSpawnAsync2 = _interopRequireDefault(_crossSpawnAsync);

var _transcodeError = require('./transcode-error.js');

var _transcodeError2 = _interopRequireDefault(_transcodeError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _debug = false;

var ChildPromise = (function () {
  _createClass(ChildPromise, null, [{
    key: 'debug',
    get: function get() {
      return _debug;
    },
    set: function set(val) {
      _debug = val;
    }
  }]);

  function ChildPromise(options, childOptions) {
    _classCallCheck(this, ChildPromise);

    this.options = Object.assign({
      fileName: '',
      cmd: '',
      args: [],
      cwd: '.',
      onData: function onData() {},
      onError: function onError() {},
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

  _createClass(ChildPromise, [{
    key: 'start',
    value: function start() {
      var _this = this;

      this._promise = new _bluebird2.default(function (a, r) {
        _this._accept = a;
        _this._reject = r;
        var _options = _this.options;
        var cmd = _options.cmd;
        var args = _options.args;

        _this._child = (0, _crossSpawnAsync2.default)(cmd, args, _this.childOptions);

        _this._child.stdout.on('data', function (data) {
          return _this.dataHandler(data);
        });
        _this._child.stderr.on('data', function (data) {
          return _this.stdErrHandler(data);
        });
        _this._child.on('close', function (code) {
          return _this.closeHandler(code);
        });
        _this._child.on('error', function (err) {
          return _this.errHandler(err);
        });
      });

      return this.promise;
    }
  }, {
    key: 'dataHandler',
    value: function dataHandler(buffer) {
      var data = buffer.toString().trim();
      // Only keep the last packet of data to prevent large
      // amount of output being saved in memory
      this.stdout = !/\n/.test(data) ? this.stdout + data : data;
      this.options.onData(data);
      if (ChildPromise.debug) {
        console.log('stdio: ' + data);
      }
    }
  }, {
    key: 'stdErrHandler',
    value: function stdErrHandler(buffer) {
      var data = buffer.toString();
      this.stderr += data;
      this.options.onError(data);
      if (ChildPromise.debug) {
        console.log('stderr: ' + data);
      }
    }
  }, {
    key: 'errHandler',
    value: function errHandler(err) {
      var additional = err.toString().trim();
      this._reject(new _transcodeError2.default('Child process encountered an error.', this.options.fileName, additional));
    }
  }, {
    key: 'closeHandler',
    value: function closeHandler(code) {
      if (code !== 0 && this.options.muted !== true) {
        this.errHandler(this.stderr);
      } else {
        this._accept(this.stdout);
      }
    }
  }, {
    key: 'kill',
    value: function kill() {
      try {
        this._child.kill();
      } catch (e) {}
    }
  }, {
    key: 'promise',
    get: function get() {
      return this._promise;
    }
  }, {
    key: 'child',
    get: function get() {
      return this._child;
    }
  }]);

  return ChildPromise;
})();

exports.default = ChildPromise;
;
