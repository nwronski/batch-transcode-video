'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x10, _x11, _x12) { var _again = true; _function: while (_again) { var object = _x10, property = _x11, receiver = _x12; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x10 = parent; _x11 = property; _x12 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _indexJs = require('./index.js');

var _indexJs2 = _interopRequireDefault(_indexJs);

var _charm2 = require('charm');

var _charm3 = _interopRequireDefault(_charm2);

var _libUtilJs = require('./lib/util.js');

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
    this.progress = new Progress((0, _charm3['default'])(process));
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

var Progress = (function () {
  function Progress(charm) {
    _classCallCheck(this, Progress);

    this.charm = charm;
    this.counts = {
      skipped: 0,
      written: 0,
      errored: 0,
      queued: 0
    };
    this.color = {
      skipped: 'blue',
      written: 'green',
      errored: 'red',
      queued: 'yellow'
    };
    this.bold = {
      skipped: false,
      written: false,
      errored: true,
      queued: true
    };
  }

  _createClass(Progress, [{
    key: 'start',
    value: function start() {
      this.charm.display('bright').foreground('cyan').write('Starting batch operation...\n\n');
    }
  }, {
    key: 'finish',
    value: function finish() {
      this.charm.display('bright').foreground('cyan').write('Finished processing.\n\n');
    }
  }, {
    key: 'summary',
    value: function summary(state) {
      try {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = state.files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var file = _step.value;

            var type = undefined;
            if (file.isWritten) {
              type = 'written';
            } else if (file.isErrored || file.isRunning) {
              type = 'errored';
            } else if (file.isReady) {
              type = 'queued';
            } else {
              type = 'skipped';
            }
            this.counts[type] += 1;
            this.bulletPoint('' + this.labelPad(type.toUpperCase() + ': ', 10) + this.truncateStr(file.fileName, 0.75, 10), this.color[type], this.bold[type]);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator['return']) {
              _iterator['return']();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = Object.keys(this.counts)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var type = _step2.value;

            var total = this.counts[type];
            if (total > 0) {
              this.bulletPoint(total + ' file' + (total !== 1 ? 's' : '') + ' ' + type + '.', this.color[type], this.bold[type]);
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
              _iterator2['return']();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        this.bulletPoint('Processed ' + state.processed + ' MB of ' + state.total + ' total MB across ' + state.files.length + ' file' + (state.files.length !== 1 ? 's' : '') + '.', 'cyan');
        var finalMsg = state.success ? 'Finished without error.' : 'Finished with errors.';
        this.bulletPoint(finalMsg, state.success ? 'green' : 'red', true);
      } catch (e) {
        console.log(e.message);
        console.log(e.stack);
      }
    }
  }, {
    key: 'write',
    value: function write(state) {
      var cur = state.current;
      var total = state.total;
      this.bar('Current', cur.percent);
      this.truncatedLine('File', cur.file, (0, _libUtilJs.millisecondsToStr)(cur.remaining));
      this.charm.write('\n');
      this.bar('Total', total.percent);
      this.truncatedLine('Status', total.status, (0, _libUtilJs.millisecondsToStr)(total.remaining));
      this.charm.write('\n');
    }
  }, {
    key: 'bulletPoint',
    value: function bulletPoint(line, color) {
      var bold = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      this.charm.display(bold ? 'bright' : 'reset').foreground(color).write(' - ' + line + '\n');
    }
  }, {
    key: 'truncatedLine',
    value: function truncatedLine(label) {
      var str = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
      var extra = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
      var size = arguments.length <= 3 || arguments[3] === undefined ? 0.5 : arguments[3];
      var labelLen = arguments.length <= 4 || arguments[4] === undefined ? 8 : arguments[4];

      var firstPad = ' '.repeat(CliBatchTranscodeVideo.FIRST_TAB);
      var formatted = this.truncateStr(str, size, labelLen);
      this.charm.foreground('blue').write('' + firstPad + this.labelPad(label + ': ', labelLen)).display('reset').foreground('white').write('' + formatted).foreground('yellow').write('  ' + extra + '\n');
    }
  }, {
    key: 'truncateStr',
    value: function truncateStr(str) {
      var size = arguments.length <= 1 || arguments[1] === undefined ? 0.5 : arguments[1];
      var labelLen = arguments.length <= 2 || arguments[2] === undefined ? 8 : arguments[2];

      var maxLen = 100.0 * size;
      var maxWithoutLabel = maxLen - labelLen;
      var formatted = undefined;
      if (str.length > maxWithoutLabel) {
        var frontStr = str.slice(0, maxWithoutLabel - 13);
        var endStr = str.slice(-10);
        formatted = frontStr + '...' + endStr;
      } else {
        var paddingSize = maxWithoutLabel - str.length;
        var padding = ' '.repeat(paddingSize);
        formatted = '' + str + padding;
      }
      return formatted;
    }
  }, {
    key: 'labelPad',
    value: function labelPad(label) {
      var pad = arguments.length <= 1 || arguments[1] === undefined ? 8 : arguments[1];

      return label.length < pad ? label + ' '.repeat(pad - label.length) : label;
    }
  }, {
    key: 'bar',
    value: function bar(label, percent) {
      var size = arguments.length <= 2 || arguments[2] === undefined ? 0.5 : arguments[2];

      var printPercent = (0, _libUtilJs.fractionToPercent)(percent);
      var colored = Math.round(Number.parseFloat(printPercent) * size);
      var uncolored = 100 * size - colored;
      this.charm.display('bright').foreground('blue').write(this.labelPad(label + ': ', CliBatchTranscodeVideo.FIRST_TAB)).display('reset').background('cyan').write(' '.repeat(colored)).display('reset').background('black').write(' '.repeat(uncolored)).display('reset').display('bright').write('  ' + printPercent + '%\n');
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.charm.up(6).erase('line').erase('down').write('\r');
    }
  }]);

  return Progress;
})();

;
module.exports = exports['default'];
