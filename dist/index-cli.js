'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _index = require('./index.js');

var _index2 = _interopRequireDefault(_index);

var _progress = require('./lib/progress.js');

var _progress2 = _interopRequireDefault(_progress);

var _help = require('./lib/help.js');

var _help2 = _interopRequireDefault(_help);

var _charm2 = require('charm');

var _charm3 = _interopRequireDefault(_charm2);

var _childPromise = require('./lib/child-promise.js');

var _childPromise2 = _interopRequireDefault(_childPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CliBatchTranscodeVideo).call(this, options, transcodeOptions));

    _this.timer = null;
    _this.files = [];
    _this.charm = (0, _charm3.default)(process);
    if (_this.options['help'] === true) {
      (0, _help2.default)(_this.charm);
      process.exit(0);
    }
    _this.progress = new _progress2.default(_this.charm, CliBatchTranscodeVideo.FIRST_TAB);
    _childPromise2.default.debug = _this.options['debug'];
    return _possibleConstructorReturn(_this, _this);
  }

  _createClass(CliBatchTranscodeVideo, [{
    key: 'cli',
    value: function cli() {
      var _this2 = this;

      process.on('uncaughtException', function (err) {
        _this2.error = err;
        _this2.onError(err);
      });
      process.on('exit', function () {
        if (!_this2.isFinished) {
          _this2.status = _index2.default.ERRORED;
        }
        if (_this2.files && _this2.files.length) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = _this2.files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var file = _step.value;

              try {
                if (file._encode !== null) {
                  file._encode.kill();
                }
              } catch (e) {}
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
        _this2.finish();
      });

      if (this.options['quiet'] !== true) {
        this.progress.start();
      }

      if (this.options['debug'] !== true && this.options['quiet'] !== true) {
        this.progress.write(this.state());
        this.timer = setInterval(function () {
          var state = _this2.state();
          _this2.progress.clear();
          _this2.progress.write(state);
        }, CliBatchTranscodeVideo.INTERVAL_MS);
      }

      return this.transcodeAll().then(function (res) {
        return _this2.onSuccess(res);
      }).catch(function (err) {
        return _this2.onError(err);
      });
    }
  }, {
    key: 'finish',
    value: function finish() {
      if (this.timer !== null) {
        clearInterval(this.timer);
        this.timer = null;
      }
      if (this.options['quiet'] !== true) {
        // this.progress.clear();
        this.progress.finish();
        this.progress.summary(this.finalState());
      }
      if (!this.isSuccess) {
        process.reallyExit(1);
      }
    }
  }, {
    key: 'finalState',
    value: function finalState() {
      var processed = this.processedFileSizes;
      var total = this.totalFileSizes;
      var seconds = this.totalTime / 1000.0;
      var speed = processed / seconds;
      var workCount = this.files.reduce(function (t, file) {
        return t + file.currentPercent;
      }, 0);
      var average = workCount > 0 ? this.totalTime / workCount : 0;
      return {
        files: this.files,
        processed: processed.toFixed(2),
        total: total.toFixed(2),
        speed: speed.toFixed(2),
        success: this.isFinished,
        error: this.error,
        elapsed: this.totalTime,
        average: average
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
            processed: (processed > 0 ? processed.toFixed(2) : '(estimating)') + ' MB of ' + remaining + ' MB',
            files: this.files
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
})(_index2.default);

exports.default = CliBatchTranscodeVideo;
;
