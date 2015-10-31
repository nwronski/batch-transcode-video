'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = help;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('./util.js');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function help() {
  var argColor = _chalk2.default.yellow.bold;
  var help = [];
  help.push(_chalk2.default.white.bold('batch-transcode-video manual\n'));
  help.push(argColor('--input [path]') + '\t[' + _chalk2.default.blue('current directory') + '] (Alias: ' + argColor('-i') + ')');
  help.push((0, _util.splitter)('The input directory containing the source videos to transcode.'));
  help.push(argColor('--output [path]') + '\t[' + _chalk2.default.blue('same as input') + ']\t(Alias: ' + argColor('-o') + ')');
  help.push((0, _util.splitter)('The output directory to hold the transcoded videos. If you do not specify an output directory then each transcoded file will be placed in the same directory as its source file. Note: if a source file is already in the same file format as the transcoded video (e.g.: both source and output are both .mkv) then you must specify an output directory, as the program will not overwrite existing files.'));
  help.push(argColor('--mask [str]') + '\t[' + _chalk2.default.blue('**' + _path2.default.sep + '*.{mp4,avi,mkv,m4v,ts,mov}') + '] (Alias: ' + argColor('-m') + ')');
  help.push((0, _util.splitter)('Search pattern to use for input directory. Note that the default pattern will search in nested directories. For more information about what values can be used, see the node-glob documentation.'));
  help.push(argColor('--diff'));
  help.push((0, _util.splitter)('Enable this option if you only want to transcode source files that do not exist already in the output folder.'));
  help.push(argColor('--debug'));
  help.push((0, _util.splitter)('Enable verbose logging mode. Will allow you to see the output from the child processes spawned for detect-crop and transcode-video.'));
  help.push(argColor('--flatten'));
  help.push((0, _util.splitter)('Do not preserve relative directory structure in output directory. If this is enabled, the base output folder will contain all transcoded videos. Note: this option has no effect unless you specify an output directory.'));
  help.push(argColor('--quiet'));
  help.push((0, _util.splitter)('Log only file writes, errors, and finish (e.g.: success, failure) messages.'));
  var helpStr = help.join('\n');
  return helpStr;
};
//# sourceMappingURL=help.js.map
