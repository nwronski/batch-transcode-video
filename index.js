var path          = require('path');
var chalk         = require('chalk');
var denodeify     = require('promise').denodeify;
var glob          = denodeify(require('glob'));
var transcoder    = require('./lib/transcoder');
var options       = require('./lib/options');
var say           = require('./lib/say');
var childPromise  = require('./lib/child-promise');
var repeat        = require('./lib/repeat');
var curDir        = process.cwd();

if (options['help']) {
  console.log(require('./lib/help')());
  process.exit(0);
}

process.on('exit', function () {
  var summary = say.getSummary();
  say.logSummary(summary);
  if (!summary.isSuccess) {
    process.reallyExit(1);
  }
});

var filePattern = path.normalize(options['input'] + path.sep + options['mask']);
console.log(chalk.white.bold('- Starting batch operation...'));
say.notify('Scanning for media using search pattern.', say.DEBUG, filePattern);
return glob(filePattern, {})
.then(function (files) {
  if (files.length === 0) {
    var e = new Error('No files found for search pattern provided.');
    e.file = filePattern;
    throw e;
  }
  say.notify._fileCount = files.length;
  return transcoder(files);
}, function (err) {
  e.file = filePattern;
  e.additional = err.message;
  e.message = 'File system error encountered while scanning for media.';
  throw err;
})
.catch(function (err) {
  say.notify(err);
});
