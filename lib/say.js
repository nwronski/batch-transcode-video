var chalk         = require('chalk');
var options       = require('./options');
var Promise       = require('promise');
var isString      = require('./util').isString;
var INFO          = 'INFO';
var ERROR         = 'ERROR';
var DEBUG         = 'DEBUG';
var WRITE         = 'WRITE';

function log(obj) {
  var shouldEmit = true;
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
  if (shouldEmit) {
    if (obj.message) {
      var t = chalk.gray.bold(('0' + (new Date()).toLocaleTimeString()).slice(-11) + '  ');
      var h = chalk[headerBg].gray.bold(' ' + obj.type.toUpperCase() + ' ');
      var m = chalk.white.bold('  ' + obj.message);

      console.log(chalk.blue.bold('- ' + obj.file));
      console.log('  -> ' + t + h + m);
    }
    if (obj.additional) {
      console.log(chalk.yellow.bold('  -> Additional information'));
      console.log(obj.additional);
    }
  }
}

function notify(m, t, f, a) {
  var pkg = m;
  if (isString(m)) {
    var type = t || ERROR;
    var addt = type === ERROR || options['debug'] ? a : null;
    pkg = {
      message: m,
      type: type,
      file: f,
      additional: addt
    };
  } else {
    m.type = ERROR;
  }
  notify._packages.push(pkg);
  log(pkg);
  return pkg;
}
notify._packages = [];
notify._fileCount = 0;

function getSummary() {
  var errors = notify._packages.filter((p) => p.type === ERROR);
  var writes = notify._packages.filter((p) => p.type === WRITE);
  var dryRun = options['dry-run'];
  return {
    writes: writes,
    errors: errors,
    errorCount: errors.length,
    writeCount: writes.length,
    fileCount: notify._fileCount,
    isDryRun: dryRun,
    isSuccess: errors.length === 0 && (dryRun || (writes.length > 0 && writes.length === notify._fileCount))
  };
}

function logSummary(summary) {
  console.log(chalk.white.bold('- Batch operation summary...'));

  if (summary.writeCount > 0) {
    console.log(chalk.blue.bold('  -> ' + summary.writeCount + ' files of ' + summary,fileCount + ' total files transcoded.'));
    if (options['debug']) {
      summary.writes.forEach((p) => console.log(chalk.blue('    -> ' + p.file)));
    }
  } else if (!summary.isDryRun) {
    console.log(chalk.yellow.bold('  -> No files created.'));
  }

  if (summary.errorCount > 0) {
    console.log(chalk.yellow.bold('  -> ' + summary.errorCount + ' files failed to transcode.'));
    if (options['debug']) {
      summary.errors.forEach((p) => console.log(chalk.yellow('    -> ' + p.file)));
    }
  }

  if (summary.isSuccess) {
    console.log(chalk.green.bold('  -> Finished without error.'));
  } else {
    console.log(chalk.red.bold('  -> Finished with errors.'));
  }
}

module.exports = {
  getSummary:   getSummary,
  logSummary:   logSummary,
  log:          log,
  notify:       notify,
  INFO:         INFO,
  ERROR:        ERROR,
  DEBUG:        DEBUG,
  WRITE:        WRITE
};
