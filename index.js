var path          = require('path');
var denodeify     = require('promise').denodeify;
var glob          = denodeify(require('glob'));
var transcoder    = require('./lib/transcoder');
var options       = require('./lib/options');
var say           = require('./lib/say');
var childPromise  = require('./lib/child-promise');
var repeat        = require('./lib/repeat');
var curDir        = process.cwd();

process.on('exit', function () {
  var messages = [];
  if (options['dry-run']) {
    messages.push('This was a dry run.');
  } else {
    messages.push('Created ' + say.writeCount + ' file' + (say.writeCount !== 1 ? 's' : '') + '.');
  }
  messages.push('Encountered ' + say.errCount + ' error' + (say.errCount !== 1 ? 's' : '') + '.');
  var finalState = (say.errCount > 0 || (say.writeCount <= 0 && !options['dry-run'])) ? 'failure' : 'success';
  say(messages.join(' '), finalState);
  if (say.errCount > 0) {
    process.reallyExit(1);
  }
});

var filePattern = path.normalize(options['input'] + path.sep + options['mask']);
say('Scanning for media: ' + filePattern, 'debug');
return glob(filePattern, {})
.then(function (files) {
  if (files.length === 0) {
    throw new Error('[No Files Found] ' + filePattern);
  }
  return transcoder(files);
}, function (err) {
  throw new Error('[Glob Error] ' + err.message);
})
.catch(function (err) {
  say(err.message);
});
