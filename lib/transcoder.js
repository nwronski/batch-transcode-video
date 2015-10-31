import chalk from 'chalk';
import options from './options.js';
import path from 'path';
import {resolve, denodeify} from 'promise';
import _mkdirp from 'mkdirp';
import {stat as _stat} from 'fs';
let mkdirp = denodeify(_mkdirp);
let stat = denodeify(_stat);
import childPromise from './child-promise.js';
import {parse} from 'shell-quote';
import * as say from './say.js';
import pace from 'pace';
let curDir = process.cwd();

let progressPattern = 'Encoding: task';
let progressPercent = /(\d{1,3}\.\d{1,2})\s*\%/;
let timePattern = '([0-9]{2}\:[0-9]{2}\:[0-9]{2})';
let handbrakeLog = new RegExp(`^${timePattern}`);
let handbrakeFinish = new RegExp(`Encode done![\n\s]*HandBrake has exited.[\s\n]*Elapsed time: ${timePattern}`, 'i');

function handbrakeProgress(str) {
  let quant;
  let lastIndex = str.lastIndexOf(progressPattern);
  if (lastIndex !== -1 && progressPercent.test(str)) {
    let matches = str.substr(lastIndex).match(progressPercent);
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

export default function transcoder(files) {
  let unknownSizes  = say.notify._fileCount;
  // TODO: get progress bar to render at 0%
  let progressBar   = pace({total: Math.max(unknownSizes * 100, 100)});
  let fileSizes     = [];
  let knownSizes    = (frac = 1.0) => (fileSizes.length ? Number.parseInt(fileSizes[0] * frac, 10) : 0) + fileSizes.slice(1).reduce((p, c) => p + c, 0);
  let currentQuant  = 0;
  let startTime = Date.now();
  let lastTime = startTime;

  let updateProgress = function updateProgress(f) {
    progressBar.op(Math.min(knownSizes(f), progressBar.total));
  };

  let progressTimer = setInterval(function timingFunction() {
    if (currentQuant > 0) {
      let currentTime = Date.now();
      let totalTime = (lastTime - startTime) / currentQuant;
      let elapsedSinceLast = (currentTime - startTime) / totalTime;
      updateProgress(Math.max(Math.min(elapsedSinceLast, 1.0), 0));
    } else {
      progressBar.op(Math.min(progressBar.current + (progressBar.total * 0.005), progressBar.total));
    }
  }, 1000);

  progressBar.op(1);

  let updateProgressTotal = function updateProgressTotal(size) {
    if (Number.isInteger(size)) {
      let sizeNorm = Number.parseInt(size / 1000000.0, 10);
      fileSizes.unshift(sizeNorm);
    } else {
      say.notify._fileCount -= 1;
      say.notify._skipCount += 1;
    }
    unknownSizes -= 1;
    let adjTotal = knownSizes();
    let avgSize = Number.parseInt(adjTotal / fileSizes.length, 10);
    adjTotal += avgSize * unknownSizes;
    progressBar.total = adjTotal;
    return adjTotal;
  };

  function processNext(arr) {
    if (arr.length) {
      currentQuant = 0;
      startTime = Date.now();
      lastTime = startTime;
      let filePath = arr.shift();
      let filePathNorm = path.normalize(filePath);
      let fileName = path.basename(filePathNorm);
      let filePathDir = path.dirname(filePathNorm);
      // TODO: will change based on custom options
      let destFileName = path.basename(fileName, path.extname(fileName)) + '.' + options['dest-ext'];
      let usePath, logFileName, destFilePath, sourceFilePath;
      let errCatcher = getErrorHandler(fileName);
      let sourceFileSize;
      // console.log(chalk.blue.bold('- ' + fileName));
      if (options['output']) {
        let outputDir = path.relative(curDir, options['output']);
        usePath = !options['flatten'] ?
            // Add relative paths from --input to filePathDir when --o given
            path.resolve(outputDir, path.relative(options['input'], filePathDir)) :
            // --flatten option so do not add relative path
            outputDir;
      } else {
        // Output is same place a input
        usePath = filePathDir;
      }

      // Use relative path from curDir (cwd)
      usePath = path.resolve(curDir, usePath);
      sourceFilePath = path.relative(curDir, filePathNorm);
      destFilePath = path.normalize(usePath + path.sep + destFileName);

      let nextFile = function () {
        return processNext(arr);
      };

      // Adjust the total running time
      return stat(sourceFilePath)
      .then(function (stats) {
        // Update the progress bar based on the size of the source file
        sourceFileSize = stats.size;
        return mkdirp(usePath, {});
      })
      .then(function () {
        return stat(destFilePath);
      })
      .then(function (stats) {
        // Destination file already exists, subtract from totals
        updateProgressTotal(null);
        var e = new Error('File already exists in output directory.');
        e.type = options['diff'] ? say.INFO : say.ERROR;
        e.file = destFilePath;
        throw e;
      }, function (err) {
        updateProgressTotal(sourceFileSize);
        return childPromise('detect-crop', [sourceFilePath], fileName, curDir, !options['debug'])
        .then(function (res) {
          let commandLines = res.replace(/\n+$/gm, '');
          let commands = commandLines.split(/\n+/);
          let useCommand = commands[commands.length - 1].trim();
          if (!/^transcode\-video/.test(useCommand)) {
            let e = new Error('Crop detection failed. Skipping transcode for file.');
            e.additional = useCommand;
            throw e;
          }
          return useCommand;
        })
        .then(function (command) {
          let useArgs = parse(command);
          useArgs.splice(1, 0, '--output', usePath);
          if (options['--'].length) {
            useArgs.splice.apply(useArgs, [useArgs.length - 1, 0].concat(options['--']));
          }
          let crop = useArgs.indexOf('--crop') + 1;
          if (crop > 0) {
            say.notify(`Crop values detected for file: ${useArgs[crop]}.`, say.DEBUG, fileName, command);
          } else {
            let e = new Error('Could not detect crop values. Skipping transcode for file.');
            e.additional = command;
            throw e;
          }
          return useArgs;
        })
        .then(function (args) {
          say.notify('Starting transcoding operation for file.', say.DEBUG, fileName, args.join(' '));
          return childPromise(args[0], args.slice(1), fileName, curDir, !options['debug'], function (buff) {
            let quant = handbrakeProgress(buff);
            if (quant !== null) {
              currentQuant = quant;
              lastTime = Date.now();
              // updateProgress(quant);
            }
          });
        })
        .then(function (output) {
          // Get total running time
          if (options['dry-run']) {
            say.notify('Finished processing file.', say.INFO, destFilePath, output);
          } else {
            // Check the output from the trasncode to confirm it finished
            let transcodeStatus = output.match(handbrakeFinish);
            if (transcodeStatus === null) {
              let e = new Error('Transcode probably did not succeed for file.');
              e.additional = output;
              throw e;
            }
            return childPromise('query-handbrake-log', ['time', destFilePath + '.log'], destFileName, curDir, true)
            .then(function (log) {
              let totalTime = log.trim().match(timePattern)[1];
              say.notify(`Total: ${transcodeStatus[1]}. Transcoding: ${totalTime}`, say.WRITE, destFilePath, output);
            });
          }
        });
      })
      .catch(errCatcher)
      .then(nextFile, nextFile);
    }
    say.notify.stopProgressTimer();
    progressBar.op(progressBar.total);
    return resolve(true);
  }

  return processNext(files);
};
