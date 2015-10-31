'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transcoder;

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _options = require('./options.js');

var _options2 = _interopRequireDefault(_options);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _promise = require('promise');

var _mkdirp2 = require('mkdirp');

var _mkdirp3 = _interopRequireDefault(_mkdirp2);

var _fs = require('fs');

var _childPromise = require('./child-promise.js');

var _childPromise2 = _interopRequireDefault(_childPromise);

var _shellQuote = require('shell-quote');

var _say = require('./say.js');

var say = _interopRequireWildcard(_say);

var _pace = require('pace');

var _pace2 = _interopRequireDefault(_pace);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { return obj && obj.constructor === Symbol ? "symbol" : typeof obj; }

var mkdirp = (0, _promise.denodeify)(_mkdirp3.default);
var stat = (0, _promise.denodeify)(_fs.stat);

var curDir = process.cwd();

var progressPattern = 'Encoding: task';
var progressPercent = /(\d{1,3}\.\d{1,2})\s*\%/;
var timePattern = '([0-9]{2}\:[0-9]{2}\:[0-9]{2})';
var handbrakeLog = new RegExp('^' + timePattern);
var handbrakeFinish = new RegExp('Encode done![\ns]*HandBrake has exited.[s\n]*Elapsed time: ' + timePattern, 'i');

function handbrakeProgress(str) {
  var quant = undefined;
  var lastIndex = str.lastIndexOf(progressPattern);
  if (lastIndex !== -1 && progressPercent.test(str)) {
    var matches = str.substr(lastIndex).match(progressPercent);
    quant = Number.parseFloat(matches[1]) / 100.0;
  }
  return quant;
}

function getErrorHandler(file) {
  return function (err) {
    err.file = err.file || file;
    say.notify(err);
  };
}

function transcoder(files) {
  var unknownSizes = say.notify._fileCount;
  // TODO: get progress bar to render at 0%
  var progressBar = (0, _pace2.default)({ total: Math.max(unknownSizes * 100, 100) });
  var fileSizes = [];
  var knownSizes = function knownSizes() {
    var frac = arguments.length <= 0 || arguments[0] === undefined ? 1.0 : arguments[0];
    return (fileSizes.length ? Number.parseInt(fileSizes[0] * frac, 10) : 0) + fileSizes.slice(1).reduce(function (p, c) {
      return p + c;
    }, 0);
  };
  var currentQuant = 0;
  var startTime = Date.now();
  var lastTime = startTime;

  var updateProgress = function updateProgress(f) {
    progressBar.op(Math.min(knownSizes(f), progressBar.total));
  };

  var progressTimer = setInterval(function timingFunction() {
    if (currentQuant > 0) {
      var currentTime = Date.now();
      var totalTime = (lastTime - startTime) / currentQuant;
      var elapsedSinceLast = (currentTime - startTime) / totalTime;
      updateProgress(Math.max(Math.min(elapsedSinceLast, 1.0), 0));
    } else {
      progressBar.op(Math.min(progressBar.current + progressBar.total * 0.005, progressBar.total));
    }
  }, 1000);

  progressBar.op(1);

  var updateProgressTotal = function updateProgressTotal(size) {
    if (Number.isInteger(size)) {
      var sizeNorm = Number.parseInt(size / 1000000.0, 10);
      fileSizes.unshift(sizeNorm);
    } else {
      say.notify._fileCount -= 1;
      say.notify._skipCount += 1;
    }
    unknownSizes -= 1;
    var adjTotal = knownSizes();
    var avgSize = Number.parseInt(adjTotal / fileSizes.length, 10);
    adjTotal += avgSize * unknownSizes;
    progressBar.total = adjTotal;
    return adjTotal;
  };

  function processNext(arr) {
    if (arr.length) {
      var _ret = (function () {
        currentQuant = 0;
        startTime = Date.now();
        lastTime = startTime;
        var filePath = arr.shift();
        var filePathNorm = _path2.default.normalize(filePath);
        var fileName = _path2.default.basename(filePathNorm);
        var filePathDir = _path2.default.dirname(filePathNorm);
        // TODO: will change based on custom options
        var destFileName = _path2.default.basename(fileName, _path2.default.extname(fileName)) + '.' + _options2.default['dest-ext'];
        var usePath = undefined,
            logFileName = undefined,
            destFilePath = undefined,
            sourceFilePath = undefined;
        var errCatcher = getErrorHandler(fileName);
        var sourceFileSize = undefined;
        // console.log(chalk.blue.bold('- ' + fileName));
        if (_options2.default['output']) {
          var outputDir = _path2.default.relative(curDir, _options2.default['output']);
          usePath = !_options2.default['flatten'] ?
          // Add relative paths from --input to filePathDir when --o given
          _path2.default.resolve(outputDir, _path2.default.relative(_options2.default['input'], filePathDir)) :
          // --flatten option so do not add relative path
          outputDir;
        } else {
          // Output is same place a input
          usePath = filePathDir;
        }

        // Use relative path from curDir (cwd)
        usePath = _path2.default.resolve(curDir, usePath);
        sourceFilePath = _path2.default.relative(curDir, filePathNorm);
        destFilePath = _path2.default.normalize(usePath + _path2.default.sep + destFileName);

        var nextFile = function nextFile() {
          return processNext(arr);
        };

        // Adjust the total running time
        return {
          v: stat(sourceFilePath).then(function (stats) {
            // Update the progress bar based on the size of the source file
            sourceFileSize = stats.size;
            return mkdirp(usePath, {});
          }).then(function () {
            return stat(destFilePath);
          }).then(function (stats) {
            // Destination file already exists, subtract from totals
            updateProgressTotal(null);
            var e = new Error('File already exists in output directory.');
            e.type = _options2.default['diff'] ? say.INFO : say.ERROR;
            e.file = destFilePath;
            throw e;
          }, function (err) {
            updateProgressTotal(sourceFileSize);
            return (0, _childPromise2.default)('detect-crop', [sourceFilePath], fileName, curDir, !_options2.default['debug']).then(function (res) {
              var commandLines = res.replace(/\n+$/gm, '');
              var commands = commandLines.split(/\n+/);
              var useCommand = commands[commands.length - 1].trim();
              if (!/^transcode\-video/.test(useCommand)) {
                var e = new Error('Crop detection failed. Skipping transcode for file.');
                e.additional = useCommand;
                throw e;
              }
              return useCommand;
            }).then(function (command) {
              var useArgs = (0, _shellQuote.parse)(command);
              useArgs.splice(1, 0, '--output', usePath);
              if (_options2.default['--'].length) {
                useArgs.splice.apply(useArgs, [useArgs.length - 1, 0].concat(_options2.default['--']));
              }
              var crop = useArgs.indexOf('--crop') + 1;
              if (crop > 0) {
                say.notify('Crop values detected for file: ' + useArgs[crop] + '.', say.DEBUG, fileName, command);
              } else {
                var e = new Error('Could not detect crop values. Skipping transcode for file.');
                e.additional = command;
                throw e;
              }
              return useArgs;
            }).then(function (args) {
              say.notify('Starting transcoding operation for file.', say.DEBUG, fileName, args.join(' '));
              return (0, _childPromise2.default)(args[0], args.slice(1), fileName, curDir, !_options2.default['debug'], function (buff) {
                var quant = handbrakeProgress(buff);
                if (quant !== null) {
                  currentQuant = quant;
                  lastTime = Date.now();
                  // updateProgress(quant);
                }
              });
            }).then(function (output) {
              // Get total running time
              if (_options2.default['dry-run']) {
                say.notify('Finished processing file.', say.INFO, destFilePath, output);
              } else {
                var _ret2 = (function () {
                  // Check the output from the trasncode to confirm it finished
                  var transcodeStatus = output.match(handbrakeFinish);
                  if (transcodeStatus === null) {
                    var e = new Error('Transcode probably did not succeed for file.');
                    e.additional = output;
                    throw e;
                  }
                  return {
                    v: (0, _childPromise2.default)('query-handbrake-log', ['time', destFilePath + '.log'], destFileName, curDir, true).then(function (log) {
                      var totalTime = log.trim().match(timePattern)[1];
                      say.notify('Total: ' + transcodeStatus[1] + '. Transcoding: ' + totalTime, say.WRITE, destFilePath, output);
                    })
                  };
                })();

                if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
              }
            });
          }).catch(errCatcher).then(nextFile, nextFile)
        };
      })();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }
    say.notify.stopProgressTimer();
    progressBar.op(progressBar.total);
    return (0, _promise.resolve)(true);
  }

  return processNext(files);
};
//# sourceMappingURL=transcoder.js.map
