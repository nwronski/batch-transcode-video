var path          = require('path');
var splitter      = require('./splitter');
var chalk         = require('chalk');
var argColor      = chalk.yellow.bold;
var help          = [];
help.push(chalk.white.bold('batch-transcode-video manual\n'));
help.push(argColor('--input [path]')+'\t[' + chalk.blue('current directory') + '] (Alias: ' + argColor('-i') + ')');
help.push(splitter('The input directory containing the source videos to transcode.'));
help.push(argColor('--output [path]')+'\t[' + chalk.blue('same as input') + ']\t(Alias: ' + argColor('-o') + ')');
help.push(splitter('The output directory to hold the transcoded videos. If you do not specify an output directory then each transcoded file will be placed in the same directory as its source file. Note: if a source file is already in the same file format as the transcoded video (e.g.: both source and output are both .mkv) then you must specify an output directory, as the program will not overwrite existing files.'));
help.push(argColor('--mask [str]')+'\t[' + chalk.blue('**' + path.sep + '*.{mp4,avi,mkv,m4v,ts,mov}') + '] (Alias: ' + argColor('-m') + ')');
help.push(splitter('Search pattern to use for input directory. Note that the default pattern will search in nested directories. For more information about what values can be used, see the node-glob documentation.'));
help.push(argColor('--diff'));
help.push(splitter('Enable this option if you only want to transcode source files that do not exist already in the output folder.'));
help.push(argColor('--debug'));
help.push(splitter('Enable verbose logging mode. Will allow you to see the output from the child processes spawned for detect-crop and transcode-video.'));
help.push(argColor('--flatten'));
help.push(splitter('Do not preserve relative directory structure in output directory. If this is enabled, the base output folder will contain all transcoded videos. Note: this option has no effect unless you specify an output directory.'));
help.push(argColor('--quiet'));
help.push(splitter('Log only file writes, errors, and finish (e.g.: success, failure) messages.'));

module.exports = function () {
  return help.join('\n');
};
