import path from 'path';
import {splitter} from './util.js';

const args = [
  {
    arg: 'input [path]',
    desc: 'The input directory containing the source videos to transcode.',
    def: 'current directory',
    alias: 'i'
  },
  {
    arg: 'output [path]',
    desc: 'The output directory to hold the transcoded videos. If you do not specify an output directory then each transcoded file will be placed in the same directory as its source file. Note: if a source file is already in the same file format as the transcoded video (e.g.: both source and output are both .mkv) then you must specify an output directory, as the program will not overwrite existing files.',
    def: 'same as input',
    alias: 'o'
  },
  {
    arg: 'mask [str]',
    desc: 'Search pattern to use for input directory. Note that the default pattern will search in nested directories. For more information about what values can be used, see the node-glob documentation.',
    def: `**${path.sep}*.{mp4,avi,mkv,m4v,ts,mov}`,
    alias: 'm'
  },
  {
    arg: 'diff',
    desc: 'Enable this option if you only want to transcode source files that do not exist already in the output folder.'
  },
  {
    arg: 'debug',
    desc: 'Enable verbose logging mode. Will allow you to see the output from the child processes spawned for detect-crop and transcode-video.'
  },
  {
    arg: 'flatten',
    desc: 'Do not preserve relative directory structure in output directory. If this is enabled, the base output folder will contain all transcoded videos. Note: this option has no effect unless you specify an output directory.'
  },
  {
    arg: 'quiet',
    desc: 'Do not log output messages to command line, only exit 0 if successful or 1 if there are errors. This will disable the progress bars that display the current progress and remaining time estimates and also the summary output (writes, errors, stats) at end of process.'
  }
];

export default function help(charm) {
  charm
  .display('bright')
  .write('batch-transcode-video manual\n\n');

  for (let arg of args) {
    printArg(arg, charm);
  }
};

function printArg({arg, desc = false, def = false, alias = false}, charm) {
  charm
  .display('reset')
  .display('bright')
  .foreground('yellow')
  .write(`--${arg}`);
  if (def) {
    charm
    .display('reset')
    .foreground('blue')
    .write(`\t[${def}]`);
  }
  if (alias) {
    charm
    .display('reset')
    .write(` (Alias: `)
    .display('bright')
    .foreground('yellow')
    .write(`-${alias}`)
    .write(`)`)
  }
  charm
  .write('\n');
  if (desc) {
    charm
    .display('reset')
    .foreground('white')
    .write(`${splitter(desc)}\n`);
  }
}
