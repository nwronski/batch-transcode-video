'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _glob2 = require('glob');

var _glob3 = _interopRequireDefault(_glob2);

var _fs = require('fs');

var _libTranscodeErrorJs = require('./lib/transcode-error.js');

var _libTranscodeErrorJs2 = _interopRequireDefault(_libTranscodeErrorJs);

var _libVideoFileJs = require('./lib/video-file.js');

var _libVideoFileJs2 = _interopRequireDefault(_libVideoFileJs);

var glob = _bluebird2['default'].promisify(_glob3['default']);

var stat = _bluebird2['default'].promisify(_fs.stat);

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
  }]);

  function BatchTranscodeVideo(filePattern, options) {
    _classCallCheck(this, BatchTranscodeVideo);

    this.filePattern = filePattern;
    this.options = options;
    this.status = BatchTranscodeVideo.INACTIVE;
    this.files = new Set();
    this._ready = this.createEntries();
    return this;
  }

  _createClass(BatchTranscodeVideo, [{
    key: 'createEntries',
    value: function createEntries() {
      var _this = this;

      return glob(this.filePattern, {}).then(function (files) {
        if (files.length === 0) {
          throw new _libTranscodeErrorJs2['default']('No files found for search pattern provided.', filePattern);
        }
        return files;
      }, function (err) {
        throw new _libTranscodeErrorJs2['default']('File system error encountered while scanning for media.', filePattern, err.message);
      }).map(function (file) {
        return _this.resolvePath(file);
      }, {
        concurrency: 3
      }).map(function (entry) {
        _this.files.add(entry);
      }).then(function () {
        return _this.files;
      });
    }
  }, {
    key: 'transcodeAll',
    value: function transcodeAll() {
      var _this2 = this;

      return this._ready.then(function () {
        _this2.status = BatchTranscodeVideo.RUNNING;
        return _this2.files;
      }).mapSeries(function (video) {
        _this2.currentFile = video;
        return _this2.currentFile.transcode();
      }).then(function () {
        _this2.status = BatchTranscodeVideo.FINISHED;
        _this2.currentFile = null;
      })['catch'](function (err) {
        _this2.status = BatchTranscodeVideo.ERRORED;
        throw err;
      });
    }
  }, {
    key: 'resolvePath',
    value: function resolvePath(filePath) {
      var _this3 = this;

      return stat(filePath).then(function (stats) {
        return new _libVideoFileJs2['default'](filePath, stats, _this3.options);
      });
    }
  }, {
    key: 'ready',
    get: function get() {
      return this._ready;
    }

    // get currentFile() {
    //   for (let video of this.files) {
    //     if (video.isRunning) {
    //       return video;
    //     }
    //   }
    //   return null;
    // }
  }]);

  return BatchTranscodeVideo;
})();

exports['default'] = BatchTranscodeVideo;
;
module.exports = exports['default'];
