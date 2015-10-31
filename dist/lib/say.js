'use strict';

var chalk = require('chalk');
var options = require('./options');
var Promise = require('promise');
var isString = require('./util').isString;
var INFO = 'INFO';
var ERROR = 'ERROR';
var DEBUG = 'DEBUG';
var WRITE = 'WRITE';

function log(obj) {
  var shouldEmit = true;
  var fileColor = obj.type === ERROR ? 'yellow' : 'blue';
  var headerBg;
  switch (obj.type) {
    case WRITE:
      headerBg = 'bgGreen';
      break;
    case DEBUG:
      shouldEmit = options['debug'];
      headerBg = 'bgBlue';
      break;
    case INFO:
      shouldEmit = !options['quiet'];
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
    var t = chalk.gray.bold(('0' + obj.time.toLocaleTimeString()).slice(-11) + '  ');
    var h = chalk[headerBg].gray.bold(' ' + obj.type.toUpperCase() + ' ');
    var m = chalk.white.bold('  ' + obj.message);

    console.log(chalk[fileColor].bold('  -> ' + obj.file));
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
  if (m == null || isString(m)) {
    var addt = type === ERROR || options['debug'] ? a : null;
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
  var dryRun = options['dry-run'];
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
  var plur;
  console.log(chalk.white.bold('\n\n- Batch operation summary...'));

  if (summary.skipCount > 0) {
    plur = summary.writeCount !== 1 ? 's' : '';
    console.log(chalk.cyan.bold('  -> ' + summary.skipCount + ' file' + plur + ' skipped.'));
  }

  if (summary.writeCount > 0) {
    plur = summary.writeCount !== 1 ? 's' : '';
    console.log(chalk.blue.bold('  -> ' + summary.writeCount + ' file' + plur + ' of ' + summary.fileCount + ' total transcoded.'));
    if (options['debug']) {
      summary.writes.forEach(function (p) {
        return log(p);
      });
    }
  } else if (!summary.isDryRun) {
    console.log(chalk.yellow.bold('  -> No files created.'));
  }

  if (summary.errorCount > 0) {
    plur = summary.errorCount !== 1 ? 's' : '';
    console.log(chalk.yellow.bold('  -> ' + summary.errorCount + ' file' + plur + ' failed to transcode.'));
    if (options['debug']) {
      summary.errors.forEach(function (p) {
        return log(p);
      });
    }
  }

  if (summary.isSuccess) {
    console.log(chalk.green.bold('  -> Finished without error.'));
  } else {
    console.log(chalk.red.bold('  -> Finished with errors.'));
  }
}

module.exports = {
  getSummary: getSummary,
  logSummary: logSummary,
  log: log,
  notify: notify,
  INFO: INFO,
  ERROR: ERROR,
  DEBUG: DEBUG,
  WRITE: WRITE
};
//# sourceMappingURL=say.js.map
