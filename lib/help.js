var path          = require('path');
var splitter      = require('./splitter');
var help = [];
help.push('batch-transcode-video Manual\n');
help.push('--input [path]\t(Default: process.cwd()) (Alias: -I)');
help.push(splitter('The input directory containing the source videos to transcode.'));
help.push('--output [path]\t(Default: same as source ) (Alias: -O)');
help.push(splitter('The output directory to hold the transcoded videos. If you do not specify an output directory then each transcoded file will be placed in the same directory as its source file. Note: if a source file is already in the same file format as the transcoded video (e.g.: both source and output are both .mkv) then you must specify an output directory, as the program will not overwrite existing files.'));
help.push('--diff\t\t(Flag)\t(Default: false)');
help.push(splitter('Enable this option if you only want to transcode source files that do not exist already in the output folder.'));
help.push('--mask [str]\t(Default: **' + path.sep + '*.{mp4,avi,mkv,m4v,ts,mov} ) (Alias: -M)');
help.push(splitter('Search pattern to use for input directory. Note that the default pattern will search in nested directories. For more information about what values can be used, see the node-glob documentation.'));
help.push('--debug\t\t(Flag)\t(Default: false)');
help.push(splitter('Enable verbose logging mode. Will allow you to see the output from the child processes spawned for detect-crop and transcode-video.'));
help.push('--flatten\t(Flag)\t(Default: false)');
help.push(splitter('Do not preserve relative directory structure in output directory. If this is enabled, the base output folder will contain all transcoded videos. Note: this option has no effect unless you specify an output directory.'));
help.push('--quiet\t\t(Flag)\t(Default: false)');
help.push(splitter('Log only file writes, errors, and finish (e.g.: success, failure) messages.'));

module.exports = function () {
  return help.join('\n');
};
