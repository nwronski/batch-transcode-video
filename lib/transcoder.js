var options       = require('./options');
var path          = require('path');
var Promise       = require('promise');
var denodeify     = Promise.denodeify;
var mkdirp        = denodeify(require('mkdirp'));
var stat          = denodeify(require('fs').stat);
var childPromise  = require('./child-promise');
var parse         = require('shell-quote').parse;
var say           = require('./say');
var curDir        = process.cwd();

function transcode(filePath) {
  var filePathNorm = path.normalize(filePath);
  var fileName = path.basename(filePathNorm);
  var filePathDir = path.dirname(filePathNorm);
  // TODO: will change based on custom options
  var destFileName = path.basename(fileName, path.extname(fileName)) + '.' + options['dest-ext'];
  var usePath, logFileName, destFilePath;
  if (options['output']) {
    var outputDir = !path.isAbsolute(options['output']) ?
        path.relative(curDir, options['output']) : options['output'];
    usePath = !options['flatten'] ?
        // Add relative paths from --input to filePathDir when --o given
        path.resolve(outputDir, path.relative(options['input'], filePathDir)) :
        // --flatten option so do not add relative path
        outputDir;
  } else {
    // Output is same place a input
    usePath = filePathDir;
  }
  if (!path.isAbsolute(usePath)) {
    // Use relative path from curDir (cwd)
    usePath = path.resolve(curDir, usePath);
  }
  destFilePath = path.normalize(usePath + path.sep + destFileName);
  logFileName = destFilePath + '.log';
  say('[Start Processing] ' + fileName, 'debug');
  return stat(destFilePath)
  .then(function (stats) {
    // Destination file already exists
    if (options['diff']) {
      say('[Skipping File] ' + fileName, 'info');
    } else {
      throw new Error('[File Already Exists] ' + destFilePath);
    }
    // Just ignore and continue to the next file
  }, function () {
    // Destination file does not exist already
    return mkdirp(usePath)
    .then(function () {
      var cropPath = !path.isAbsolute(filePathNorm) ?
          path.relative(curDir, filePathNorm) : filePathNorm;
      return childPromise('detect-crop', [cropPath], fileName, curDir, !options['debug']);
    })
    .then(function (res) {
      var commandLines = res.replace(/\n+$/gm, '');
      var commands = commandLines.split(/\n+/);
      var useCommand = commands[commands.length - 1].trim();
      if (!/^transcode\-video/.test(useCommand)) {
        throw new Error('[Crop Error] ' + fileName + "\n\n" + useCommand);
      }
      return useCommand;
    })
    .then(function (command) {
      var useArgs = parse(command);
      useArgs.splice(1, 0, '--output', usePath);
      if (options['--'].length) {
        useArgs.splice.apply(useArgs, [useArgs.length - 1, 0].concat(options['--']));
      }
      var crop = useArgs.indexOf('--crop') + 1;
      if (crop > 0) {
        say('[Crop: ' + useArgs[crop] + '] ' + fileName, 'info');
      } else {
        throw new Error('[Invalid Crop] ' + fileName);
      }
      return useArgs;
    })
    .then(function (args) {
      say('[Transcoding] ' + fileName, 'info');
      return childPromise(args[0], args.slice(1), fileName, curDir, !options['debug']);
    })
    .then(function (output) {
      say('[Stop Processing] ' + fileName, 'debug');
      // Get total running time
      if (options['dry-run']) {
        say(destFilePath, 'write');
      } else {
        return childPromise('query-handbrake-log', ['time', logFileName], destFileName, curDir, true)
        .then(function (log) {
          var totalTime = log.trim().match(/^([0-9]{2}\:[0-9]{2}\:[0-9]{2})/)[1];
          say('[Time: ' + totalTime + '] ' + destFilePath, 'write');
        });
      }
    });
  })
  .catch(function (err) {
    say(err.message);
  });
}

function transcodeAll(files) {
  if (files.length) {
    var file = files.splice(0, 1)[0];
    var nextFile = function () {
      return transcodeAll(files);
    };
    return transcode(file).then(nextFile, nextFile);
  }
  return Promise.resolve(true);
}

module.exports = transcodeAll;
