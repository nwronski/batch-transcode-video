'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('./util.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var curDir = process.cwd();
var defs = {
  '--': true,
  alias: {
    input: 'i',
    output: 'o',
    mask: 'm',
    help: 'h'
  },
  boolean: ['debug', 'quiet', 'flatten', 'diff', 'help'],
  string: ['input', 'output', 'mask'],
  default: {
    // Input folder
    input: curDir,
    // Output folder
    output: null,
    // Search pattern for glob in input directory
    mask: '**' + _path2.default.sep + '*.{mp4,avi,mkv,m4v,ts,mov}',
    // Verbose logging
    debug: false,
    // Do not preserve relative directory structure in output directory
    flatten: false,
    // Log only writes, errors, and finish (success, failure) message
    quiet: false,
    // Only try to transcode videos that do not exist in the output directory
    diff: false,
    help: false
  },
  unknown: function unknown(arg) {
    var chalk = require('chalk');
    var errMessage = [];
    console.log(chalk.bgRed.gray.bold('ERROR') + chalk.white.bold('\tUnrecognized command ') + chalk.yellow.bold(arg) + chalk.white.bold(' provided.'));
    errMessage.push('If you would like to supply custom options to');
    errMessage.push('transcode-video then put them at end of the command');
    errMessage.push('after a double dash "--". For example to pass the ');
    errMessage.push('"--dry-run" command to transcode-video:');
    console.log((0, _util.splitter)(errMessage.join(' '), true, 60));
    console.log(chalk.white.bold('batch-transcode-video --input my_videos/ -- --dry-run'));
    process.exit(1);
  }
};
var argv = (0, _minimist2.default)(process.argv.slice(2), defs);
argv['input'] = _path2.default.resolve(curDir, argv['input']);
argv['dry-run'] = argv['--'].length ? argv['--'].reduce(function (prev, cur) {
  return prev || /^\-\-dry\-run$/i.test(cur.trim());
}, false) : false;
var destExtensionRegex = /^\-{2}(mp4|m4v)$/i;
argv['dest-ext'] = argv['--'].reduce(function (prev, cur) {
  var curArg = cur.trim();
  if (destExtensionRegex.test(curArg)) {
    return curArg.match(destExtensionRegex)[1];
  }
  return prev;
}, 'mkv');

exports.default = argv;
//# sourceMappingURL=options.js.map
