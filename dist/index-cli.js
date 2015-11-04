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

var _charm2 = require('charm');

var _charm3 = _interopRequireDefault(_charm2);

var _libUtilJs = require('./lib/util.js');

var CliBatchTranscodeVideo = (function (_BatchTranscodeVideo) {
  _inherits(CliBatchTranscodeVideo, _BatchTranscodeVideo);

  function CliBatchTranscodeVideo(options, transcodeOptions) {
    _classCallCheck(this, CliBatchTranscodeVideo);

    _get(Object.getPrototypeOf(CliBatchTranscodeVideo.prototype), 'constructor', this).call(this, options, transcodeOptions);
    this.progress = null;
    this.charm = (0, _charm3['default'])(process);
    return this;
  }

  _createClass(CliBatchTranscodeVideo, [{
    key: 'cli',
    value: function cli() {
      var _this = this;

      process.on('exit', function () {
        return _this.finish();
      });
      return this.startProgress().then(function () {
        return _this.transcodeAll();
      }).then(function (res) {
        return _this.onSuccess(res);
      })['catch'](function (err) {
        return _this.onError(err);
      });
    }
  }, {
    key: 'startProgress',
    value: function startProgress() {
      this.charm.write('Starting batch operation...\n\n');

      this.write();
      this.progress = setInterval(function () {
        // this.clear();
        // this.write();
      }, 1000);
      return _bluebird2['default'].resolve(true);
    }
  }, {
    key: 'stopProgress',
    value: function stopProgress() {
      if (this.progress !== null) {
        clearInterval(this.progress);
        this.progress = null;
      }
      return _bluebird2['default'].resolve(true);
    }
  }, {
    key: 'printSummary',
    value: function printSummary() {
      console.log("WE DONE");
      return true;
    }
  }, {
    key: 'finish',
    value: function finish() {
      var _this2 = this;

      return this.stopProgress().then(function () {
        return _this2.printSummary();
      }).then(function () {
        if (!_this2.isSuccess) {
          process.reallyExit(1);
        }
      });
    }
  }, {
    key: 'write',
    value: function write() {
      var currentFile = '(Please wait...)';
      var totalProg = 0,
          totalCTime = 0,
          totalTTime = 0;
      var fileProg = 0,
          fileCTime = 0,
          fileTTime = 0;
      if (this.isRunning) {
        var _currentFile = this.currentFile.fileName;
        var _totalProg = this.currentPercent;
        var _totalCTime = (0, _libUtilJs.millisecondsToStr)(this.currentTime);
        var _totalTTime = (0, _libUtilJs.millisecondsToStr)(this.totalTime);
        var _fileProg = this.currentFile.currentPercent;
        var _fileCTime = (0, _libUtilJs.millisecondsToStr)(this.currentFile.currentTime);
        var _fileTTime = (0, _libUtilJs.millisecondsToStr)(this.currentFile.totalTime);
      }
      this.charm.write('Current: ' + currentFile + '\n').write('\t' + fileProg + '%\tElapsed: ' + (0, _libUtilJs.millisecondsToStr)(fileCTime) + '\tRemaining: ' + (0, _libUtilJs.millisecondsToStr)(fileTTime) + '\n').write('\t' + totalProg + '%\tElapsed: ' + (0, _libUtilJs.millisecondsToStr)(totalCTime) + '\tRemaining: ' + (0, _libUtilJs.millisecondsToStr)(totalTTime));
    }
  }, {
    key: 'clear',
    value: function clear() {
      // this.charm.up(2).erase('line').erase('down').write("\r");
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

// console.log('- Starting batch operation...');
// say.notify('Scanning for media using search pattern.', say.DEBUG, filePattern);
module.exports = exports['default'];
