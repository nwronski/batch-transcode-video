'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

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
            remaining: this.remainingTime
          }
        };
      } catch (e) {
        return {
          current: {
            file: '[Calculating remaining time, please wait...]',
            percent: 0,
            elapsed: 0,
            remaining: 0
          },
          total: {
            percent: 0,
            elapsed: 0,
            remaining: 0
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

  // console.log('- Starting batch operation...');
  // say.notify('Scanning for media using search pattern.', say.DEBUG, filePattern);

  _createClass(Progress, [{
    key: 'start',
    value: function start() {
      this.charm.write('Starting batch operation...\n\n');
    }
  }, {
    key: 'finish',
    value: function finish() {
      this.charm.write('\n\nFinished processing.');
    }
  }, {
    key: 'write',
    value: function write(state) {
      var cur = state.current;
      var total = state.total;
      this.bar(cur.percent);
      this.charm.display('reset')
      // TODO: Add ellipsis to file name over certain size
      .write('\tFile: ' + cur.file + '\n').write('Current\t' + (0, _libUtilJs.fractionToPercent)(cur.percent) + '%\t\tElapsed: ' + (0, _libUtilJs.millisecondsToStr)(cur.elapsed) + '\tRemaining: ' + (0, _libUtilJs.millisecondsToStr)(cur.remaining) + '\n').write('Total\t' + (0, _libUtilJs.fractionToPercent)(total.percent) + '%\t\tElapsed: ' + (0, _libUtilJs.millisecondsToStr)(total.elapsed) + '\tRemaining: ' + (0, _libUtilJs.millisecondsToStr)(total.remaining) + '\n\n');
    }
  }, {
    key: 'bar',
    value: function bar(percent) {
      var size = arguments.length <= 1 || arguments[1] === undefined ? 0.5 : arguments[1];

      var printPercent = (0, _libUtilJs.fractionToPercent)(percent);
      var colored = Math.round(Number.parseFloat(printPercent) * size);
      var uncolored = 100 * size - colored;
      this.charm.display('reset').write('\t').background('cyan').write(' '.repeat(colored)).display('reset').background('black').write(' '.repeat(uncolored)).display('reset').display('bright').write('\t' + printPercent + '%\n');
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.charm.up(5).erase('line').erase('down').write('\r');
    }
  }]);

  return Progress;
})();

module.exports = exports['default'];
