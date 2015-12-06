'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = help;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('./util.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var args = [{
  arg: 'input [path]',
  desc: 'The input directory containing the source videos to transcode.',
  def: 'current directory',
  alias: 'i'
}, {
  arg: 'output [path]',
  desc: 'The output directory to hold the transcoded videos. If you do not specify an output directory then each transcoded file will be placed in the same directory as its source file. Note: if a source file is already in the same file format as the transcoded video (e.g.: both source and output are both .mkv) then you must specify an output directory, as the program will not overwrite existing files.',
  def: 'same as input',
  alias: 'o'
}, {
  arg: 'mask [str]',
  desc: 'Search pattern to use for input directory. Note that the default pattern will search in nested directories. For more information about what values can be used, see the node-glob documentation.',
  def: '**' + _path2.default.sep + '*.{mp4,avi,mkv,m4v,ts,mov}',
  alias: 'm'
}, {
  arg: 'force [crop]',
  desc: 'If you provide an actual crop value (e.g.: "0:0:0:0") as the argument for this option, then that crop value will be used for all videos. If you provide anything other than an actual crop value (e.g. 1) as the argument for this option, then when crop detection returns conflicting crop values it will just use the least extreme crop value and continue transcoding.',
  def: 'false',
  alias: 'f'
}, {
  arg: 'diff',
  desc: 'Enable this option if you only want to transcode source files that do not exist already in the output folder.'
}, {
  arg: 'debug',
  desc: 'Enable verbose logging mode. Will allow you to see the output from the child processes spawned for detect-crop and transcode-video.'
}, {
  arg: 'flatten',
  desc: 'Do not preserve relative directory structure in output directory. If this is enabled, the base output folder will contain all transcoded videos. Note: this option has no effect unless you specify an output directory.'
}, {
  arg: 'quiet',
  desc: 'Do not log output messages to command line, only exit 0 if successful or 1 if there are errors. This will disable the progress bars that display the current progress and remaining time estimates and also the summary output (writes, errors, stats) at end of process.'
}];

function help(charm) {
  charm.display('bright').write('batch-transcode-video manual\n\n');

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = args[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var arg = _step.value;

      printArg(arg, charm);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};

function printArg(_ref, charm) {
  var arg = _ref.arg;
  var _ref$desc = _ref.desc;
  var desc = _ref$desc === undefined ? false : _ref$desc;
  var _ref$def = _ref.def;
  var def = _ref$def === undefined ? false : _ref$def;
  var _ref$alias = _ref.alias;
  var alias = _ref$alias === undefined ? false : _ref$alias;

  charm.display('reset').display('bright').foreground('yellow').write('--' + arg);
  if (def) {
    charm.display('reset').foreground('blue').write('\t[' + def + ']');
  }
  if (alias) {
    charm.display('reset').write(' (Alias: ').display('bright').foreground('yellow').write('-' + alias).display('reset').write(')');
  }
  charm.write('\n');
  if (desc) {
    charm.display('reset').foreground('white').write((0, _util.splitter)(desc) + '\n');
  }
}
