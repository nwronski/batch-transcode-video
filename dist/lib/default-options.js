'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var curDir = process.cwd();
exports['default'] = {
  // Input folder
  input: curDir,
  // Output folder
  output: null,
  // Search pattern for glob in input directory
  mask: '**' + _path2['default'].sep + '*.{mp4,avi,mkv,m4v,ts,mov}',
  // Verbose logging
  debug: false,
  // Do not preserve relative directory structure in output directory
  flatten: false,
  // No progress or summary information logged to console.
  quiet: false,
  // Only try to transcode videos that do not exist in the output directory
  diff: false,
  help: false
};
module.exports = exports['default'];
