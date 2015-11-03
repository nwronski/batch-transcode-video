import BatchTranscodeVideo from '../dist/index.js';
import minimist from 'minimist';
import path from 'path';
import {splitter} from '../dist/lib/util.js';
import chalk from 'chalk';
import help from '../dist/lib/help.js';
import defaultOptions from '../dist/lib/default-options.js';
import * as say from '../dist/lib/say.js';
let defs = {
  '--': true,
  alias: {
    input: 'i',
    output: 'o',
    mask: 'm',
    help: 'h'
  },
  boolean: [
    'debug', 'quiet', 'flatten', 'diff', 'help'
  ],
  string: [
    'input', 'output', 'mask'
  ],
  default: defaultOptions,
  unknown: function (arg) {
    let errMessage = [];
    console.log(chalk.bgRed.gray.bold('ERROR') +
        chalk.white.bold('\tUnrecognized command ') +
          chalk.yellow.bold(arg) + chalk.white.bold(' provided.'));
    errMessage.push('If you would like to supply custom options to');
    errMessage.push('transcode-video then put them at end of the command');
    errMessage.push('after a double dash "--". For example to pass the ');
    errMessage.push('"--dry-run" command to transcode-video:');
    console.log(splitter(errMessage.join(' '), true, 60));
    console.log(chalk.white.bold('batch-transcode-video --input my_videos/ -- --dry-run'));
    process.exit(1);
  }
};
let options = minimist(process.argv.slice(2), defs);
options['transcodeOptions'] = [];
if (options['--'].length) {
  options['transcodeOptions'] = options['--'];
  delete options['--'];
}
options['curDir'] = process.cwd();
options['input'] = path.resolve(options['curDir'], options['input']);
options['dryRun'] = options['transcodeOptions'].length ? options['transcodeOptions'].reduce(function (prev, cur) {
  return prev || /^\-\-dry\-run$/i.test(cur.trim());
}, false) : false;
let destExtensionRegex = /^\-{2}(mp4|m4v)$/i;
options['destExt'] = options['transcodeOptions'].reduce(function (prev, cur) {
  let curArg = cur.trim();
  if (destExtensionRegex.test(curArg)) {
    return curArg.match(destExtensionRegex)[1];
  }
  return prev;
}, 'mkv');

if (options['help']) {
  console.log(help());
  process.exit(0);
}

// process.on('exit', function () {
//   let summary = say.getSummary();
//   say.logSummary(summary);
//   if (!summary.isSuccess) {
//     process.reallyExit(1);
//   }
// });


let filePattern = path.normalize(options['input'] + path.sep + options['mask']);
console.log(chalk.white.bold('- Starting batch operation...'));
// say.notify('Scanning for media using search pattern.', say.DEBUG, filePattern);

let batch = new BatchTranscodeVideo(filePattern, options);

batch.transcodeAll()
.then(function () {
  console.log("done");
  process.exit(0);
})
.catch(function (err) {
  console.log(err);
  process.exit(0);
});
