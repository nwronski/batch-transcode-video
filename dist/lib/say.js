'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.log = log;
exports.notify = notify;
exports.getSummary = getSummary;
exports.logSummary = logSummary;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _options = require('./options');

var _options2 = _interopRequireDefault(_options);

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

var _util = require('./util');

var INFO = 'INFO';
exports.INFO = INFO;
var ERROR = 'ERROR';
exports.ERROR = ERROR;
var DEBUG = 'DEBUG';
exports.DEBUG = DEBUG;
var WRITE = 'WRITE';

exports.WRITE = WRITE;

function log(obj) {
  var shouldEmit = true;
  var fileColor = obj.type === ERROR ? 'yellow' : 'blue';
  var headerBg = undefined;
  switch (obj.type) {
    case WRITE:
      headerBg = 'bgGreen';
      break;
    case DEBUG:
      shouldEmit = _options2['default']['debug'];
      headerBg = 'bgBlue';
      break;
    case INFO:
      shouldEmit = !_options2['default']['quiet'];
      headerBg = 'bgCyan';
      break;
    case ERROR:
    default:
      headerBg = 'bgRed';
      break;
  }
  if (!shouldEmit) {
    return false;
  }
  if (obj.message) {
    var t = _chalk2['default'].gray.bold(('0' + obj.time.toLocaleTimeString()).slice(-11) + '  ');
    var h = _chalk2['default'][headerBg].gray.bold(' ' + obj.type.toUpperCase() + ' ');
    var m = _chalk2['default'].white.bold('  ' + obj.message);

    console.log(_chalk2['default'][fileColor].bold('  -> ' + obj.file));
    console.log('    -> ' + t + h + m);
  }
  if (obj.additional) {
    console.log(obj.additional);
  }
  return true;
}

function notify(m, t, f, a) {
  var pkg = m;
  var type = t || ERROR;
  if (m == null || (0, _util.isString)(m)) {
    var addt = type === ERROR || _options2['default']['debug'] ? a : null;
    pkg = {
      message: m,
      type: type,
      file: f,
      additional: addt
    };
  } else {
    m.type = m.type || type;
  }
  pkg.time = new Date();
  notify._packages.push(pkg);
  return pkg;
}

notify._packages = [];
notify._fileCount = 0;
notify._skipCount = 0;
notify._timer = null;
notify.stopProgressTimer = function stopProgressTimer() {
  if (notify._timer !== null) {
    clearInterval(notify._timer);
    notify._timer = null;
  }
};

function getSummary() {
  var errors = notify._packages.filter(function (p) {
    return p.type === ERROR;
  });
  var writes = notify._packages.filter(function (p) {
    return p.type === WRITE;
  });
  var dryRun = _options2['default']['dryRun'];
  return {
    writes: writes,
    errors: errors,
    errorCount: errors.length,
    writeCount: writes.length,
    skipCount: notify._skipCount,
    fileCount: notify._fileCount,
    isDryRun: dryRun,
    isSuccess: errors.length === 0 && (dryRun || writes.length > 0 && writes.length === notify._fileCount)
  };
}

function logSummary(summary) {
  var plur = undefined;
  console.log(_chalk2['default'].white.bold('\n\n- Batch operation summary...'));

  if (summary.skipCount > 0) {
    plur = summary.writeCount !== 1 ? 's' : '';
    console.log(_chalk2['default'].cyan.bold('  -> ' + summary.skipCount + ' file' + plur + ' skipped.'));
  }

  if (summary.writeCount > 0) {
    plur = summary.writeCount !== 1 ? 's' : '';
    console.log(_chalk2['default'].blue.bold('  -> ' + summary.writeCount + ' file' + plur + ' of ' + summary.fileCount + ' total transcoded.'));
    if (_options2['default']['debug']) {
      summary.writes.forEach(function (p) {
        return log(p);
      });
    }
  } else if (!summary.isDryRun) {
    console.log(_chalk2['default'].yellow.bold('  -> No files created.'));
  }

  if (summary.errorCount > 0) {
    plur = summary.errorCount !== 1 ? 's' : '';
    console.log(_chalk2['default'].yellow.bold('  -> ' + summary.errorCount + ' file' + plur + ' failed to transcode.'));
    if (_options2['default']['debug']) {
      summary.errors.forEach(function (p) {
        return log(p);
      });
    }
  }

  if (summary.isSuccess) {
    console.log(_chalk2['default'].green.bold('  -> Finished without error.'));
  } else {
    console.log(_chalk2['default'].red.bold('  -> Finished with errors.'));
  }
}
