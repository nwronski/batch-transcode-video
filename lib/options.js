var minimist      = require('minimist');
var path          = require('path');
var curDir        = process.cwd();
var argv          = minimist(process.argv.slice(2), {
  '--': true,
  alias: {
    input: 'I',
    output: 'O',
    mask: 'M',
  },
  boolean: [
    'debug', 'quiet', 'flatten', 'diff'
  ],
  default: {
    // Input folder
    input: curDir,
    // Output folder
    output: null,
    // Search pattern for glob in input directory
    mask: '**/*.{mp4,avi,mkv,m4v,ts,mov}',
    // Verbose logging
    debug: false,
    // Do not preserve relative directory structure in output directory
    flatten: false,
    // Log only writes, errors, and finish (success, failure) message
    quiet: false,
    // Only try to transcode videos that do not exist in the output directory
    diff: false
  }
});
argv['input'] = !path.isAbsolute(argv['input']) ?
    path.resolve(curDir, argv['input']) : path.normalize(argv['input']);
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

module.exports = argv;
