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
          // for (let type of Object.keys(this.counts)) {
          //   let total = this.counts[type];
          //   if (total > 0) {
          //     this.bulletPoint(`${total} file${total !== 1 ? 's' : ''} ${type}.`, this.color[type], this.bold[type]);
          //   }
          // }
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
        this.colorBar('Summary', this.counts, state.files.length + ' file' + (state.files.length !== 1 ? 's' : ''));
        this.truncatedLine('Processed', state.processed + ' MB of ' + state.total + ' total MB');
        this.charm.write('\n');
        // this.bulletPoint(`Processed ${state.processed} MB of ${state.total} total MB across ${state.files.length} file${state.files.length !== 1 ? 's' : ''}.`, 'cyan');
        var finalMsg = state.success ? 'Finished without error.' : 'Finished with errors.';
        this.bulletPoint(finalMsg, state.success ? 'green' : 'red', true, '=>');
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
      this.truncatedLine('File', cur.file, (0, _utilJs.millisecondsToStr)(cur.remaining));
      this.charm.write('\n');
      this.bar('Total', total.percent);
      this.truncatedLine('Status', total.status, (0, _utilJs.millisecondsToStr)(total.remaining));
      this.charm.write('\n');
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

      var firstPad = ' '.repeat(this.firstTab);
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

      var printPercent = (0, _utilJs.fractionToPercent)(percent);
      var colored = Math.round(Number.parseFloat(printPercent) * size);
      var uncolored = 100.0 * size - colored;
      this.charm.display('bright').foreground('blue').write(this.labelPad(label + ': ', this.firstTab)).display('reset').background('cyan').write(' '.repeat(colored)).display('reset').background('black').write(' '.repeat(uncolored)).display('reset').display('bright').write('  ' + printPercent + '%\n');
    }
  }, {
    key: 'colorBar',
    value: function colorBar(label, counts) {
      var extra = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
      var size = arguments.length <= 3 || arguments[3] === undefined ? 0.5 : arguments[3];

      var types = Object.keys(counts);
      var totalCount = types.reduce(function (total, type) {
        return total + counts[type];
      }, 0);
      this.charm.display('bright').foreground('blue').write(this.labelPad(label + ': ', this.firstTab));
      var total = 100.0 * size;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = types[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var type = _step2.value;

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

      this.charm.display('reset').display('bright').write('  ' + extra + '\n');
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.charm.up(6).erase('line').erase('down').write('\r');
    }
  }]);

  return Progress;
})();

exports['default'] = Progress;
;
module.exports = exports['default'];
