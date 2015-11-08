'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utilJs = require('./util.js');

var Progress = (function () {
  function Progress(charm, firstTab) {
    _classCallCheck(this, Progress);

    this.charm = charm;
    this.firstTab = firstTab;
    this.firstPad = ' '.repeat(this.firstTab);
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
      this.charm.display('bright').foreground('cyan').write('Starting batch operation...').display('reset').write('\n\n');
    }
  }, {
    key: 'finish',
    value: function finish() {
      this.charm.display('bright').foreground('cyan').write('Finished processing.').display('reset').write('\n\n');
    }
  }, {
    key: 'summary',
    value: function summary(state) {
      if (state.error !== null) {
        this.charm.display('reset').foreground('white').write('\n' + state.error + '\n');
      }
      var counts = Progress.getCounts(state.files, true);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = state.files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var file = _step.value;

          var type = Progress.getStatusName(file, true);
          this.bulletPoint('' + Progress.labelPad(type.toUpperCase() + ': ', 10) + Progress.truncateStr(file.fileName, 0.75, 10), this.color[type], this.bold[type]);
          if (file.error !== null) {
            // Print error message
            this.charm.display('reset').foreground('white').write(file.error + '\n');
          }
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

      this.charm.write('\n');
      this.colorBar('Summary', counts, state.files.length + ' file' + (state.files.length !== 1 ? 's' : ''));
      this.truncatedLine('Processed', state.processed + ' MB of ' + state.total + ' total MB');
      this.charm.write('\n');
      var finalMsg = state.success ? 'Finished without error.' : 'Finished with errors.';
      this.bulletPoint(finalMsg, state.success ? 'green' : 'red', true, '=>');
      this.charm.display('reset').write('\n');
    }
  }, {
    key: 'write',
    value: function write(state) {
      var cur = state.current;
      var total = state.total;
      var counts = Progress.getCounts(total.files, false);
      this.bar('Current', cur.percent);
      this.truncatedLine('File', cur.file, (0, _utilJs.millisecondsToStr)(cur.remaining));
      this.charm.write('\n');
      this.bar('Total', total.percent);
      this.truncatedLine('Processed', total.processed, (0, _utilJs.millisecondsToStr)(total.remaining));
      this.fileStatusLine(counts);
      this.charm.display('reset').write('\n');
    }
  }, {
    key: 'fileStatusLine',
    value: function fileStatusLine(counts) {
      this.charm.display('reset').foreground('cyan').write('' + this.firstPad + Progress.labelPad('Status: '));
      counts['queued'] = Math.max(counts['queued'] - 1, 0);
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = Object.keys(counts)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var type = _step2.value;

          this.charm.display('reset').display('bright').foreground(this.color[type]).write(type[0].toUpperCase() + ': ').display('reset').write(counts[type] + '  ');
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

      this.charm.display('reset').write('\n');
    }
  }, {
    key: 'bulletPoint',
    value: function bulletPoint(line, color) {
      var bold = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];
      var dash = arguments.length <= 3 || arguments[3] === undefined ? '-' : arguments[3];

      this.charm.display(bold ? 'bright' : 'reset').foreground(color).write(' ' + dash + ' ' + line + '\n');
    }
  }, {
    key: 'truncatedLine',
    value: function truncatedLine(label) {
      var str = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
      var extra = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
      var size = arguments.length <= 3 || arguments[3] === undefined ? 0.5 : arguments[3];
      var labelLen = arguments.length <= 4 || arguments[4] === undefined ? 8 : arguments[4];

      labelLen = Math.max(labelLen, label.length + 2);
      var formatted = Progress.truncateStr(str, size, labelLen);
      this.charm.display('reset').foreground('cyan').write('' + this.firstPad + Progress.labelPad(label + ': ', labelLen)).display('reset').foreground('white').write('' + formatted).foreground('yellow').write('  ' + extra + '\n');
    }
  }, {
    key: 'bar',
    value: function bar(label, percent) {
      var size = arguments.length <= 2 || arguments[2] === undefined ? 0.5 : arguments[2];

      var printPercent = (0, _utilJs.fractionToPercent)(percent);
      var colored = Math.round(Number.parseFloat(printPercent) * size);
      var uncolored = 100.0 * size - colored;
      this.charm.display('bright').foreground('cyan').write(Progress.labelPad(label + ': ', this.firstTab)).display('reset').background('cyan').write(' '.repeat(colored)).display('reset').background('black').write(' '.repeat(uncolored)).display('reset').display('bright').write('  ' + printPercent + '%\n');
    }
  }, {
    key: 'colorBar',
    value: function colorBar(label, counts) {
      var extra = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
      var size = arguments.length <= 3 || arguments[3] === undefined ? 0.5 : arguments[3];

      var types = Object.keys(counts).filter(function (key) {
        return counts[key] > 0;
      });
      var totalCount = types.reduce(function (total, type) {
        return total + counts[type];
      }, 0);
      this.charm.display('bright').foreground('cyan').write(Progress.labelPad(label + ': ', this.firstTab));
      var total = 100.0 * size;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = types[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var type = _step3.value;

          var percent = counts[type] / totalCount;
          var printPercent = (0, _utilJs.fractionToPercent)(percent);
          var colored = Math.round(Number.parseFloat(printPercent) * size);
          if (type === types.slice(-1)[0]) {
            colored = total;
          }
          total -= colored;
          this.charm.display('reset').background(this.color[type]).write(' '.repeat(colored));
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3['return']) {
            _iterator3['return']();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      this.charm.display('reset').display('bright').write('  ' + extra + '\n');
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.charm.up(7).erase('line').erase('down').write('\r');
    }
  }], [{
    key: 'getCounts',
    value: function getCounts() {
      var files = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var done = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      var counts = {
        written: 0,
        errored: 0,
        skipped: 0,
        queued: 0
      };
      files.forEach(function (file) {
        var type = Progress.getStatusName(file, done);
        counts[type] += 1;
      });
      return counts;
    }
  }, {
    key: 'getStatusName',
    value: function getStatusName(file) {
      var done = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      var type = undefined;
      if (file.isWritten) {
        type = 'written';
      } else if (file.isErrored || done && file.isRunning) {
        type = 'errored';
      } else if (file.isSkipped) {
        type = 'skipped';
      } else if (file.isReady || !done && file.isRunning) {
        type = 'queued';
      }
      return type;
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
  }]);

  return Progress;
})();

exports['default'] = Progress;
;
module.exports = exports['default'];
