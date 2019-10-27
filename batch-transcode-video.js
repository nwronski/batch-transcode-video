import minimist from 'minimist';
import cli from '../dist/index-cli.js';
import defaultOptions from '../dist/lib/default-options.js';
const VERSION = '@@VERSION';
const UNKNOWN_MESSAGE = `If you would like to supply custom options to
 transcode-video then put them at end of the command
 after a double dash "--". For example to pass the
 "--dry-run" command to transcode-video:`.replace(/\n+/g, '');
let defs = {
  '--': true,
  alias: {
    input: 'i',
    output: 'o',
    mask: 'm',
    help: 'h',
    version: 'v',
    crop: 'c',
    keep: 'k'
  },
  boolean: [
    'debug', 'quiet', 'flatten', 'diff', 'help', 'version', 'keep', 'nocrop'
  ],
  string: [
    'input', 'output', 'mask', 'crop'
  ],
  default: defaultOptions,
  unknown: function (arg) {
    console.log(`ERROR:\tUnrecognized argument ${arg} provided.`);
    console.log(UNKNOWN_MESSAGE);
    console.log('\nbatch-transcode-video --input my_videos/ -- --dry-run');
    process.exit(1);
  }
};

let options = minimist(process.argv.slice(2), defs);

if (options['version'] === true) {
  console.log(`batch-transcode-video v${VERSION}`);
  process.exit(0);
}

let transcodeOptions = [];
if (options['--'].length) {
  transcodeOptions = options['--'].slice(0);
  delete options['--'];
}

(new cli(options, transcodeOptions)).cli();
