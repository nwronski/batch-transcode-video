'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _transcodeErrorJs = require('./transcode-error.js');

var _transcodeErrorJs2 = _interopRequireDefault(_transcodeErrorJs);

var _fs = require('fs');

var _mkdirp2 = require('mkdirp');

var _mkdirp3 = _interopRequireDefault(_mkdirp2);

var _childPromiseJs = require('./child-promise.js');

var _childPromiseJs2 = _interopRequireDefault(_childPromiseJs);

var _shellQuote = require('shell-quote');

var _utilJs = require('./util.js');

var stat = _bluebird2['default'].promisify(_fs.stat);

var mkdirp = _bluebird2['default'].promisify(_mkdirp3['default']);

var progressPattern = 'Encoding: task';
var progressPercent = /(\d{1,3}\.\d{1,2})\s*\%/;
var timePattern = '([0-9]{2}\:[0-9]{2}\:[0-9]{2})';
var handbrakeLog = new RegExp('^' + timePattern);
var handbrakeFinish = new RegExp('Encode done![\ns]*HandBrake has exited.[s\n]*Elapsed time: ' + timePattern, 'i');

var VideoFile = (function () {
  _createClass(VideoFile, null, [{
    key: 'QUEUED',
    get: function get() {
      return 0;
    }
  }, {
    key: 'RUNNING',
    get: function get() {
      return 1;
    }
  }, {
    key: 'WRITTEN',
    get: function get() {
      return 2;
    }
  }, {
    key: 'ERRORED',
    get: function get() {
      return 3;
    }
  }, {
    key: 'SKIPPED',
    get: function get() {
      return 4;
    }
  }]);

  function VideoFile(filePath, stats, options) {
    var transcodeOptions = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

    _classCallCheck(this, VideoFile);

    this.options = options;
    this.transcodeOptions = transcodeOptions;
    this.status = VideoFile.QUEUED;

    this.lastPercent = 0;

    this._crop = null;
    this._encode = null;
    this._query = null;

    this.fileName = _path2['default'].basename(filePath);
    this.filePathDir = _path2['default'].dirname(filePath);
    this.filePathRel = _path2['default'].relative(this.options['curDir'], filePath);
    this.destFileName = _path2['default'].basename(this.fileName, _path2['default'].extname(this.fileName)) + '.' + this.options['destExt'];
    this.destFileDir = this.options['output'] ? !this.options['flatten'] ?
    // Add relative paths from --input to filePathDir when --o given
    _path2['default'].resolve(this.options['output'], _path2['default'].relative(this.options['input'], this.filePathDir)) :
    // --flatten option so do not add relative path
    this.options['output'] :
    // Output is same place a input
    this.filePathDir;
    this.destFilePath = _path2['default'].normalize(this.destFileDir + _path2['default'].sep + this.destFileName);
    this.destFilePathRel = _path2['default'].relative(this.options['curDir'], this.destFilePath);
    this.fileSize = Number.parseInt(stats.size / 1000000.0, 10);
    this._ready = this._resolveDest();
    return this;
  }

  _createClass(VideoFile, [{
    key: 'transcode',
    value: function transcode() {
      var _this = this;

      return this._ready.then(function () {
        if (!_this.isReady) {
          throw new _transcodeErrorJs2['default']('File cannot be processed again.', _this.fileName);
        } else if (_this.destFileExists) {
          if (_this.options['diff']) {
            _this.status = VideoFile.SKIPPED;
            return _bluebird2['default'].resolve(false);
          } else {
            throw new _transcodeErrorJs2['default']('File already exists in output directory.', _this.fileName);
          }
        } else {
          _this.startTime = Date.now();
          _this.lastTime = _this.startTime;
          _this.status = VideoFile.RUNNING;

          return _this._detectCrop().then(function (args) {
            return _this._startEncode(args);
          }).then(function (didFinish) {
            return _this._encodeStatus(didFinish);
          }).then(function () {
            _this.lastPercent = 1.0;
            _this.status = VideoFile.WRITTEN;
            return true;
          });
        }
      })['catch'](function (e) {
        _this.error = e;
        _this.status = _this.isRunning ? VideoFile.ERRORED : _this.status;
        console.log(_this.error.toString());
      });
    }
  }, {
    key: '_detectCrop',
    value: function _detectCrop() {
      var _this2 = this;

      this._crop = new _childPromiseJs2['default']({
        cmd: 'detect-crop',
        args: [this.filePathRel],
        fileName: this.fileName,
        cwd: this.options['curDir']
      });
      return this._crop.start().then(function (output) {
        var useCommand = output.replace(/[\S]+$/gm, '').split(/\n+/).slice(-1)[0].trim();
        if (!/^transcode\-video/.test(useCommand)) {
          throw new _transcodeErrorJs2['default']('Crop detection failed. Skipping transcode for file.', _this2.fileName, useCommand);
        }
        return useCommand;
      }).then(function (command) {
        var useArgs = (0, _shellQuote.parse)(command);
        useArgs.splice(1, 0, _this2.filePathRel, '--output', _this2.destFileDir);
        useArgs.splice.apply(useArgs, [useArgs.length - 1, 0].concat(_this2.transcodeOptions));
        var crop = useArgs.indexOf('--crop') + 1;
        if (crop > 0) {
          _this2.cropValue = useArgs[crop];
          // say.notify(`Crop values detected for file: ${useArgs[crop]}.`, say.DEBUG, fileName, command);
        } else {
            throw new _transcodeErrorJs2['default']('Could not detect crop values. Skipping transcode for file.', _this2.fileName, command);
          }
        return useArgs;
      });
    }
  }, {
    key: '_startEncode',
    value: function _startEncode(_ref) {
      var _this3 = this;

      var _ref2 = _toArray(_ref);

      var cmd = _ref2[0];

      var args = _ref2.slice(1);

      // say.notify('Starting transcoding operation for file.', say.DEBUG, fileName, args.join(' '));
      this._encode = new _childPromiseJs2['default']({
        cmd: cmd,
        args: args,
        fileName: this.destFileName,
        cwd: this.options['curDir'],
        onData: function onData(data) {
          var lastIndex = data.lastIndexOf(progressPattern);
          if (lastIndex !== -1) {
            var lastData = data.substr(lastIndex);
            if (progressPercent.test(lastData)) {
              var matches = lastData.match(progressPercent);
              _this3.lastPercent = Number.parseFloat(matches[1]) / 100.0;
              _this3.lastTime = Date.now();
            }
          }
        }
      });
      return this._encode.start().then(function (output) {
        // Get total running time
        if (_this3.options['dryRun']) {
          // say.notify('Finished processing file.', say.INFO, this.destFilePath, output);
          return false;
        } else {
          // Check the output from the trasncode to confirm it finished
          var transcodeStatus = output.match(handbrakeFinish);
          if (transcodeStatus === null) {
            _this3.totalEncodeTime = null;
            throw new _transcodeErrorJs2['default']('Transcode probably did not succeed for file.', _this3.destFileName, output);
          } else {
            _this3.lastTime = Date.now();
            _this3.lastPercent = 1.0;
            _this3.totalEncodeTime = (0, _utilJs.strToMilliseconds)(transcodeStatus[1]);
          }
          return true;
        }
      });
    }
  }, {
    key: '_encodeStatus',
    value: function _encodeStatus(didFinish) {
      var _this4 = this;

      if (!didFinish) {
        this.encodeTime = null;
        return _bluebird2['default'].resolve(true);
      }
      this._query = new _childPromiseJs2['default']({
        cmd: 'query-handbrake-log',
        args: ['time', this.destFilePath + '.log'],
        fileName: this.destFileName,
        cwd: this.options['curDir']
      });
      return this._query.start().then(function (log) {
        _this4.encodeTime = (0, _utilJs.strToMilliseconds)(log.trim().match(timePattern)[1]);
        // say.notify(`Total: ${this.totalTranscodeTime. Transcoding: ${this.encodeTime}`, say.WRITE, this.destFilePath, output);
      });
    }
  }, {
    key: '_resolveDest',
    value: function _resolveDest() {
      var _this5 = this;

      return stat(this.destFilePathRel).then(function () {
        _this5.destFileExists = true;
        return true;
      }, function () {
        _this5.destFileExists = false;
        return mkdirp(_this5.destFileDir, {});
      });
    }
  }, {
    key: 'currentPercent',
    get: function get() {
      if (!this.isRunning) {
        return this.lastPercent;
      } else if (this.lastPercent <= 0) {
        return 0;
      }
      return this.currentTime / this.totalTime;
    }
  }, {
    key: 'currentTime',
    get: function get() {
      return Date.now() - this.startTime;
    }
  }, {
    key: 'totalTime',
    get: function get() {
      return (this.lastTime - this.startTime) / this.lastPercent;
    }
  }, {
    key: 'remainingTime',
    get: function get() {
      return this.totalTime - this.currentTime;
    }
  }, {
    key: 'isReady',
    get: function get() {
      return this.status === VideoFile.QUEUED;
    }
  }, {
    key: 'isRunning',
    get: function get() {
      return this.status === VideoFile.RUNNING;
    }
  }, {
    key: 'isSkipped',
    get: function get() {
      return this.status === VideoFile.SKIPPED;
    }
  }, {
    key: 'isWritten',
    get: function get() {
      return this.status === VideoFile.WRITTEN;
    }
  }, {
    key: 'isErrored',
    get: function get() {
      return this.status === VideoFile.ERRORED;
    }
  }, {
    key: 'isFinished',
    get: function get() {
      return this.isWritten || this.isErrored || this.isSkipped;
    }
  }]);

  return VideoFile;
})();

exports['default'] = VideoFile;
;
module.exports = exports['default'];
