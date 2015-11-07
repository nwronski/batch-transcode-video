'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _indexJs = require('./index.js');

var _indexJs2 = _interopRequireDefault(_indexJs);

var _libProgressJs = require('./lib/progress.js');

var _libProgressJs2 = _interopRequireDefault(_libProgressJs);

var _charm2 = require('charm');

var _charm3 = _interopRequireDefault(_charm2);

var CliBatchTranscodeVideo = (function (_BatchTranscodeVideo) {
  _inherits(CliBatchTranscodeVideo, _BatchTranscodeVideo);

  _createClass(CliBatchTranscodeVideo, null, [{
    key: 'INTERVAL_MS',
    get: function get() {
      return 1000;
    }
  }, {
    key: 'FIRST_TAB',
    get: function get() {
      return 10;
    }
  }]);

  function CliBatchTranscodeVideo(options, transcodeOptions) {
    _classCallCheck(this, CliBatchTranscodeVideo);

    _get(Object.getPrototypeOf(CliBatchTranscodeVideo.prototype), 'constructor', this).call(this, options, transcodeOptions);
    this.timer = null;
    this.progress = new _libProgressJs2['default']((0, _charm3['default'])(process), CliBatchTranscodeVideo.FIRST_TAB);
    return this;
  }

  _createClass(CliBatchTranscodeVideo, [{
    key: 'cli',
    value: function cli() {
      var _this = this;

      process.on('exit', function () {
        return _this.finish();
      });
      this.progress.start();

      this.progress.write(this.state());
      this.timer = setInterval(function () {
        _this.progress.clear();
        _this.progress.write(_this.state());
      }, CliBatchTranscodeVideo.INTERVAL_MS);

      return this.transcodeAll().then(function (res) {
        return _this.onSuccess(res);
      })['catch'](function (err) {
        return _this.onError(err);
      });
    }
  }, {
    key: 'finish',
    value: function finish() {
      if (this.timer !== null) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.progress.clear();
      this.progress.finish();
      this.progress.summary(this.finalState());
      if (!this.isSuccess) {
        process.reallyExit(1);
      }
    }
  }, {
    key: 'finalState',
    value: function finalState() {
      var processed = this.processedFileSizes;
      var total = this.totalFileSizes;
      // TODO: Not sure if this is working correctly
      var speed = processed / (this.totalTime / 1000.0);
      return {
        files: this.files,
        processed: processed.toFixed(2),
        total: total.toFixed(2),
        speed: speed.toFixed(2),
        success: this.isSuccess
      };
    }
  }, {
    key: 'state',
    value: function state() {
      try {
        var processed = this.processedFileSizes;
        var remaining = this.totalFileSizes.toFixed(2);
        return {
          current: {
            file: this.currentFile.fileName,
            percent: this.currentFile.currentPercent,
            elapsed: this.currentFile.currentTime,
            remaining: this.currentFile.remainingTime
          },
          total: {
            percent: this.currentPercent,
            elapsed: this.currentTime,
            remaining: this.remainingTime,
            status: (processed > 0 ? processed.toFixed(2) : '(estimating)') + ' MB of ' + remaining + ' MB'
          }
        };
      } catch (e) {
        return {
          current: {
            file: '[Scanning ' + this.files.length + ' files...]',
            percent: 0,
            elapsed: 0,
            remaining: 0
          },
          total: {
            percent: 0,
            elapsed: 0,
            remaining: 0,
            status: '[Calculating remaining time...]'
          }
        };
      }
    }
  }, {
    key: 'onSuccess',
    value: function onSuccess(result) {
      process.exit(0);
    }
  }, {
    key: 'onError',
    value: function onError(err) {
      process.exit(1);
    }
  }]);

  return CliBatchTranscodeVideo;
})(_indexJs2['default']);

exports['default'] = CliBatchTranscodeVideo;
;
module.exports = exports['default'];
