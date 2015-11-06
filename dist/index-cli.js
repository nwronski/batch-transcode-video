'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x6, _x7, _x8) { var _again = true; _function: while (_again) { var object = _x6, property = _x7, receiver = _x8; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x6 = parent; _x7 = property; _x8 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

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
        return _this.progress.finish();
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
      this.progress.finish();
      if (!this.isSuccess) {
        process.reallyExit(1);
      }
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
  }

  _createClass(Progress, [{
    key: 'start',
    value: function start() {
      this.charm.display('reset').write('Starting batch operation...\n\n');
    }
  }, {
    key: 'finish',
    value: function finish() {
      this.charm.display('reset').write('\nFinished processing.\n\n');
    }
  }, {
    key: 'write',
    value: function write(state) {
      var cur = state.current;
      var total = state.total;
      this.bar('Current', cur.percent);
      this.truncatedLine('File', cur.file, 'Left: ' + (0, _libUtilJs.millisecondsToStr)(cur.remaining));
      // this.statusLine({label: 'Current', elapsed: cur.elapsed, remaining: cur.remaining});
      this.charm.write('\n');
      this.bar('Total', total.percent);
      // this.statusLine({label: 'Total', elapsed: total.elapsed, remaining: total.remaining});
      this.truncatedLine('Status', total.status, 'Left: ' + (0, _libUtilJs.millisecondsToStr)(total.remaining));
      this.charm.write('\n');
    }
  }, {
    key: 'truncatedLine',
    value: function truncatedLine(label) {
      var str = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
      var extra = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
      var size = arguments.length <= 3 || arguments[3] === undefined ? 0.5 : arguments[3];

      var firstPad = ' '.repeat(CliBatchTranscodeVideo.FIRST_TAB);
      var labelLen = 8;
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
      this.charm.display('reset').write('' + firstPad + this.labelPad(label + ': ', labelLen) + formatted + '  ' + extra + '\n');
    }
  }, {
    key: 'labelPad',
    value: function labelPad(label) {
      var pad = arguments.length <= 1 || arguments[1] === undefined ? 8 : arguments[1];

      return label.length < pad ? label + ' '.repeat(pad - label.length) : label;
    }
  }, {
    key: 'statusLine',
    value: function statusLine(_ref) {
      var label = _ref.label;
      var elapsed = _ref.elapsed;
      var remaining = _ref.remaining;

      this.charm.display('reset').write(this.labelPad(label + ': ', 12) + 'Elapsed: ' + (0, _libUtilJs.millisecondsToStr)(elapsed) + '\tRemaining: ' + (0, _libUtilJs.millisecondsToStr)(remaining) + '\n');
    }
  }, {
    key: 'bar',
    value: function bar(label, percent) {
      var size = arguments.length <= 2 || arguments[2] === undefined ? 0.5 : arguments[2];

      var printPercent = (0, _libUtilJs.fractionToPercent)(percent);
      var colored = Math.round(Number.parseFloat(printPercent) * size);
      var uncolored = 100 * size - colored;
      this.charm.display('reset').write(this.labelPad(label + ': ', CliBatchTranscodeVideo.FIRST_TAB)).background('cyan').write(' '.repeat(colored)).display('reset').background('black').write(' '.repeat(uncolored)).display('reset').display('bright').write('  ' + printPercent + '%\n');
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
