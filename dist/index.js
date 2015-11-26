'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _glob2 = require('glob');

var _glob3 = _interopRequireDefault(_glob2);

var _fs = require('fs');

var _libTranscodeErrorJs = require('./lib/transcode-error.js');

var _libTranscodeErrorJs2 = _interopRequireDefault(_libTranscodeErrorJs);

var _libVideoFileJs = require('./lib/video-file.js');

var _libVideoFileJs2 = _interopRequireDefault(_libVideoFileJs);

var _libDefaultOptionsJs = require('./lib/default-options.js');

var _libDefaultOptionsJs2 = _interopRequireDefault(_libDefaultOptionsJs);

var glob = _bluebird2['default'].promisify(_glob3['default']);

var stat = _bluebird2['default'].promisify(_fs.stat);

var destExtensionRegex = /^\-{2}(mp4|m4v)$/i;
var dryRunRegex = /^\-\-dry\-run$/i;

function sumFileSizes(files) {
  var useProperty = arguments.length <= 1 || arguments[1] === undefined ? 'currentPercent' : arguments[1];

  return files.reduce(function (total, file) {
    return total + file[useProperty] * file.fileSize;
  }, 0);
}

var BatchTranscodeVideo = (function () {
  _createClass(BatchTranscodeVideo, null, [{
    key: 'INACTIVE',
    get: function get() {
      return 0;
    }
  }, {
    key: 'RUNNING',
    get: function get() {
      return 1;
    }
  }, {
    key: 'FINISHED',
    get: function get() {
      return 2;
    }
  }, {
    key: 'ERRORED',
    get: function get() {
      return 3;
    }

    /* This is the value to use before there is any data to calculate speed
     * with estimateSpeed(). A value between 100 and 3000 seems reasonable.
     */
  }, {
    key: 'EST_MS_PER_MB',
    get: function get() {
      return 1000.0;
    }
  }]);

  function BatchTranscodeVideo(options, transcodeOptions) {
    _classCallCheck(this, BatchTranscodeVideo);

    options['curDir'] = process.cwd();
    options['input'] = _path2['default'].relative(options['curDir'], options['input']);
    options['dryRun'] = transcodeOptions.length ? transcodeOptions.reduce(function (prev, cur) {
      return prev || dryRunRegex.test(cur.trim());
    }, false) : false;
    options['destExt'] = transcodeOptions.reduce(function (prev, cur) {
      var curArg = cur.trim();
      if (destExtensionRegex.test(curArg)) {
        return curArg.match(destExtensionRegex)[1];
      }
      return prev;
    }, 'mkv');
    this.filePattern = _path2['default'].normalize(options['input'] + _path2['default'].sep + options['mask']);
    this.options = Object.assign({}, _libDefaultOptionsJs2['default'], options);
    this.transcodeOptions = transcodeOptions.slice(0);
    this.status = BatchTranscodeVideo.INACTIVE;
    this.files = [];
    this.currentIndex = 0;
    this.error = null;
    this._ready = this.createEntries();
    return this;
  }

  _createClass(BatchTranscodeVideo, [{
    key: 'createEntries',
    value: function createEntries() {
      var _this = this;

      return glob(this.filePattern, {}).then(function (files) {
        if (files.length === 0) {
          throw new _libTranscodeErrorJs2['default']('No files found for search pattern provided.', _this.filePattern);
        }
        return files;
      }, function (err) {
        throw new _libTranscodeErrorJs2['default']('File system error encountered while scanning for media.', _this.filePattern, err.message);
      }).map(function (file) {
        return _this.resolvePath(file);
      }, {
        concurrency: 3
      }).then(function (files) {
        _this.files = files;
        return _this.files;
      });
    }
  }, {
    key: 'transcodeAll',
    value: function transcodeAll() {
      var _this2 = this;

      return this._ready.then(function () {
        if (!_this2.isReady) {
          throw new _libTranscodeErrorJs2['default']('Batch has already been processed.', _this2.filePattern);
        }
        _this2.startTime = Date.now();
        _this2.lastTime = _this2.startTime;
        _this2.status = BatchTranscodeVideo.RUNNING;
        return _this2.files;
      }).mapSeries(function (video, index) {
        _this2.lastTime = Date.now();
        _this2.currentIndex = index;
        return video.transcode();
      }).then(function () {
        _this2.lastTime = Date.now();
        _this2.stopTime = _this2.lastTime;
        _this2.status = BatchTranscodeVideo.FINISHED;
        _this2.currentIndex = -1;
        var errored = _this2.files.reduce(function (t, file) {
          return t + (file.isErrored ? 1 : 0);
        }, 0);
        if (errored > 0) {
          _this2.status = BatchTranscodeVideo.ERRORED;
        }
      })['catch'](function (err) {
        _this2.lastTime = Date.now();
        _this2.stopTime = _this2.lastTime;
        _this2.status = BatchTranscodeVideo.ERRORED;
        _this2.error = err;
        throw err;
      });
    }
  }, {
    key: 'resolvePath',
    value: function resolvePath(filePath) {
      var _this3 = this;

      return stat(filePath).then(function (stats) {
        return new _libVideoFileJs2['default'](filePath, stats, _this3.options, _this3.transcodeOptions, function () {
          return _this3.estimateSpeed();
        });
      });
    }
  }, {
    key: 'estimateSpeed',
    value: function estimateSpeed() {
      var processed = sumFileSizes(this.files.slice(0, this.currentIndex), 'lastPercent');
      if (processed > 0) {
        // ms/MB
        return (this.lastTime - this.startTime) / processed;
      }
      return BatchTranscodeVideo.EST_MS_PER_MB;
    }
  }, {
    key: 'processedFileSizes',
    get: function get() {
      return sumFileSizes(this.files);
    }
  }, {
    key: 'totalFileSizes',
    get: function get() {
      return this.files.reduce(function (total, file) {
        var useSize = file.fileSize;
        if (file.isErrored) {
          useSize *= file.currentPercent;
        } else if (file.isSkipped) {
          useSize = 0;
        }
        return total + useSize;
      }, 0);
    }
  }, {
    key: 'currentPercent',
    get: function get() {
      return this.processedFileSizes / this.totalFileSizes;
    }
  }, {
    key: 'currentTime',
    get: function get() {
      return (this.isRunning ? Date.now() : this.stopTime) - this.startTime;
    }
  }, {
    key: 'totalTime',
    get: function get() {
      return this.isRunning ? this.currentTime / this.currentPercent : (this.stopTime || Date.now()) - this.startTime;
    }
  }, {
    key: 'remainingTime',
    get: function get() {
      return Math.max(this.totalTime - this.currentTime, 0);
    }
  }, {
    key: 'isReady',
    get: function get() {
      return this.status === BatchTranscodeVideo.INACTIVE;
    }
  }, {
    key: 'isRunning',
    get: function get() {
      return this.status === BatchTranscodeVideo.RUNNING;
    }
  }, {
    key: 'isDone',
    get: function get() {
      return this.isFinished || this.isErrored;
    }
  }, {
    key: 'isFinished',
    get: function get() {
      return this.status === BatchTranscodeVideo.FINISHED;
    }
  }, {
    key: 'isErrored',
    get: function get() {
      return this.status === BatchTranscodeVideo.ERRORED;
    }
  }, {
    key: 'ready',
    get: function get() {
      return this._ready;
    }
  }, {
    key: 'currentFile',
    get: function get() {
      if (this.currentIndex >= 0) {
        return this.files[this.currentIndex];
      }
      return null;
    }
  }]);

  return BatchTranscodeVideo;
})();

exports['default'] = BatchTranscodeVideo;
;
module.exports = exports['default'];
