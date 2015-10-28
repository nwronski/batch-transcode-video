var chalk         = require('chalk');
var options       = require('./options');
var Promise       = require('promise');

function log(obj) {
  var shouldEmit = true;
  var headerBg;
  switch (obj.type) {
    case 'write':
      // if (!options['dry-run']) {
      //   log.writeCount += 1;
      // }
    case 'success':
      headerBg = 'bgGreen';
      break;
    case 'debug':
      shouldEmit = options['debug'];
      headerBg = 'bgBlue';
      break;
    case 'info':
      shouldEmit = !options['quiet'];
      headerBg = 'bgCyan';
      break;
    case 'error':
      // log.errCount += 1;
    case 'failure':
    default:
      headerBg = 'bgRed';
      break;
  }
  if (shouldEmit) {
    if (object.message) {
      var h = chalk[headerBg].gray.bold(obj.type.toUpperCase());
      var t = chalk.gray.bold('\t' + ('0' + (new Date()).toLocaleTimeString()).slice(-11));
      var m = chalk.white.bold('  ' + obj.message);
    }
    console.log(h + t + m);
    if (obj.additional) {
      console.log(obj.additional);
    }
  }
}

function notify(m, t, f, a) {
  var pkg = m;
  if (Object.prototype.toString.call(m) !== '[object Object]') {
    pkg = {
      message: m,
      type: t || 'error',
      file: f,
      additional: a
    };
  }
  notify._packages.push(pkg);
  log(pkg);
  return pkg;
}
notify._packages = [];
notify._fileCount = 0;

function getSummary(pkgs) {
  var errors = pkgs.filter((p) => p.type === 'error');
  var writes = pkgs.filter((p) => p.type === 'write');
  return {
    writes: writes,
    errors: errors,
    errorCount: errors.length,
    writeCount: writes.length,
    fileCount: notify._fileCount,
    isSuccess: errors.length === 0 && (options['dry-run'] || (writes > 0 && writes.length === notify._fileCount))
  };
}

// log.errCount      = 0;
// log.writeCount    = 0;

module.exports = {
  getSummary:   getSummary,
  log:          log,
  notify:       notify
};
