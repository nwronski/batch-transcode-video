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
    arg: 'force [crop]',
    desc: 'If you provide an actual crop value (e.g.: "0:0:0:0") as the argument for this option, then that crop value will be used for all videos. If you provide anything other than an actual crop value (e.g. 1) as the argument for this option, then when crop detection returns conflicting crop values it will just use the least extreme crop value and continue transcoding.',
    def: 'false',
    alias: 'f'
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
  },
  {
    arg: 'keep',
    desc: 'Never delete any output files, no matter what happens, even if the encoding task fails for the corresponding input file. If you use this option, input files that fail to encode correctly, or finish encoding, will not be deleted from the output folder. Subsequent runs, with or without using the --diff option, will not reprocess the failed input files, unless the corresponding output files are manually deleted.',
    alias: 'k'
  },
  {
    arg: 'nocrop',
    desc: 'Skip crop detection entirely (i.e., do not run detect-crop) and do not pass a --crop value to transcode-video.'
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
  .write(`--${arg}`)
  .display('reset');
  if (def) {
    charm
    .display('reset')
    .foreground('blue')
    .write(`\t[${def}]`)
    .display('reset');
  }
  if (alias) {
    charm
    .display('reset')
    .write(` (Alias: `)
    .display('bright')
    .foreground('yellow')
    .write(`-${alias}`)
    .display('reset')
    .write(`)`);
  }
  charm
  .write('\n');
  if (desc) {
    charm
    .display('reset')
    .foreground('white')
    .write(`${splitter(desc)}\n`)
    .display('reset');
  }
}
