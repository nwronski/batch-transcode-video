import chalk from 'chalk';
import path from 'path';
import {denodeify} from 'promise';
import _glob from 'glob';
import help from './lib/help.js';
let glob = denodeify(_glob);
import transcoder from './lib/transcoder.js';
import options from './lib/options.js';
import * as say from './lib/say.js';
import childPromise from './lib/child-promise.js';
import {repeat} from './lib/util.js';
let curDir = process.cwd();

export default function batchTranscodeVideo() {
  if (options['help']) {
    console.log(help());
    process.exit(0);
  }

  process.on('exit', function () {
    let summary = say.getSummary();
    say.logSummary(summary);
    if (!summary.isSuccess) {
      process.reallyExit(1);
    }
  });

  let filePattern = path.normalize(options['input'] + path.sep + options['mask']);
  console.log(chalk.white.bold('- Starting batch operation...'));
  say.notify('Scanning for media using search pattern.', say.DEBUG, filePattern);
  return glob(filePattern, {})
  .then(function (files) {
    if (files.length === 0) {
      let e = new Error('No files found for search pattern provided.');
      e.file = filePattern;
      throw e;
    }
    say.notify._fileCount = files.length;
    return transcoder(files);
  }, function (err) {
    e.file = filePattern;
    e.additional = err.message;
    e.message = 'File system error encountered while scanning for media.';
    throw err;
  })
  .catch(function (err) {
    say.notify(err);
  })
  .then(function () {
    process.exit(0);
  });
};
