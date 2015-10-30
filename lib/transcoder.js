var chalk         = require('chalk');
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

function errHandler(file) {
  return function (err) {
    err.file = file;
    say.notify(err);
  };
}

function transcode(filePath) {
  var filePathNorm = path.normalize(filePath);
  var fileName = path.basename(filePathNorm);
  var filePathDir = path.dirname(filePathNorm);
  // TODO: will change based on custom options
  var destFileName = path.basename(fileName, path.extname(fileName)) + '.' + options['dest-ext'];
  var usePath, logFileName, destFilePath;
  var errorCatcher = errHandler(fileName);
  console.log(chalk.blue.bold('- ' + fileName));
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
  // say.notify('Start processing file.', say.INFO, fileName);
  function cropAndTranscode() {
    return mkdirp(usePath, {})
    .then(function () {
      var cropPath = path.relative(curDir, filePathNorm);
      return childPromise('detect-crop', [cropPath], fileName, curDir, !options['debug']);
    })
    .then(function (res) {
      var commandLines = res.replace(/\n+$/gm, '');
      var commands = commandLines.split(/\n+/);
      var useCommand = commands[commands.length - 1].trim();
      if (!/^transcode\-video/.test(useCommand)) {
        var e = new Error('Crop detection failed. Skipping transcode for file.');
        e.additional = useCommand;
        throw e;
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
        say.notify(`Crop values detected for file: ${useArgs[crop]}.`, say.DEBUG, fileName);
      } else {
        var e = new Error('Could not detect crop values. Skipping transcode for file.');
        e.additional = command;
        throw e;
      }
      return useArgs;
    })
    .then(function (args) {
      say.notify('Starting transcoding operation for file.', say.DEBUG, fileName);
      return childPromise(args[0], args.slice(1), fileName, curDir, !options['debug']);
    })
    .then(function (output) {
      // TODO: Check the output from the trasncode to confirm it finished
      // Get total running time
      if (options['dry-run']) {
        // say.notify('Finished processing file.', say.INFO, destFilePath);
      } else {
        return childPromise('query-handbrake-log', ['time', logFileName], destFileName, curDir, true)
        .then(function (log) {
          var totalTime = log.trim().match(/^([0-9]{2}\:[0-9]{2}\:[0-9]{2})/)[1];
          say.notify(`Finished trancoding file. Running time: ${totalTime}.`, say.WRITE, destFilePath);
        });
      }
    });
  }
  return stat(destFilePath)
  .then(function (stats) {
    // Destination file already exists
    var e = new Error('File already exists in output directory.');
    e.type = options['diff'] ? say.INFO : say.ERROR;
    e.file = destFilePath;
    throw e;
  }, cropAndTranscode)
  .catch(errorCatcher);
}

function transcodeAll(files) {
  if (files.length) {
    var file = files.shift();
    var nextFile = function () {
      return transcodeAll(files);
    };
    return transcode(file).then(nextFile, nextFile);
  }
  return Promise.resolve(true);
}

module.exports = transcodeAll;
