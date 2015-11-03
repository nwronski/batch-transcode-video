import chalk from 'chalk';
import options from './options';
import Promise from 'promise';
import {isString} from './util';
export const INFO          = 'INFO';
export const ERROR         = 'ERROR';
export const DEBUG         = 'DEBUG';
export const WRITE         = 'WRITE';

export function log(obj) {
  let shouldEmit = true;
  let fileColor = obj.type === ERROR ? 'yellow' : 'blue';
  let headerBg;
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
  if (!shouldEmit) { return false; }
  if (obj.message) {
    let t = chalk.gray.bold(('0' + (obj.time).toLocaleTimeString()).slice(-11) + '  ');
    let h = chalk[headerBg].gray.bold(' ' + obj.type.toUpperCase() + ' ');
    let m = chalk.white.bold('  ' + obj.message);

    console.log(chalk[fileColor].bold('  -> ' + obj.file));
    console.log('    -> ' + t + h + m);
  }
  if (obj.additional) {
    console.log(obj.additional);
  }
  return true;
}

export function notify(m, t, f, a) {
  let pkg = m;
  let type = t || ERROR;
  if (m == null || isString(m)) {
    let addt = type === ERROR || options['debug'] ? a : null;
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

export function getSummary() {
  let errors = notify._packages.filter(p => p.type === ERROR);
  let writes = notify._packages.filter(p => p.type === WRITE);
  let dryRun = options['dryRun'];
  return {
    writes: writes,
    errors: errors,
    errorCount: errors.length,
    writeCount: writes.length,
    skipCount: notify._skipCount,
    fileCount: notify._fileCount,
    isDryRun: dryRun,
    isSuccess: errors.length === 0 && (dryRun || (writes.length > 0 && writes.length === notify._fileCount))
  };
}

export function logSummary(summary) {
  let plur;
  console.log(chalk.white.bold('\n\n- Batch operation summary...'));

  if (summary.skipCount > 0) {
    plur = summary.writeCount !== 1 ? 's' : '';
    console.log(chalk.cyan.bold(`  -> ${summary.skipCount} file${plur} skipped.`));
  }

  if (summary.writeCount > 0) {
    plur = summary.writeCount !== 1 ? 's' : '';
    console.log(chalk.blue.bold(`  -> ${summary.writeCount} file${plur} of ${summary.fileCount} total transcoded.`));
    if (options['debug']) {
      summary.writes.forEach((p) => log(p));
    }
  } else if (!summary.isDryRun) {
    console.log(chalk.yellow.bold('  -> No files created.'));
  }

  if (summary.errorCount > 0) {
    plur = summary.errorCount !== 1 ? 's' : '';
    console.log(chalk.yellow.bold(`  -> ${summary.errorCount} file${plur} failed to transcode.`));
    if (options['debug']) {
      summary.errors.forEach((p) => log(p));
    }
  }

  if (summary.isSuccess) {
    console.log(chalk.green.bold('  -> Finished without error.'));
  } else {
    console.log(chalk.red.bold('  -> Finished with errors.'));
  }
}
