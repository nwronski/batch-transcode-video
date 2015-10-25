var path          = require('path');
var minimist      = require('minimist');
var Promise       = require('promise');
var denodeify     = Promise.denodeify;
var glob          = denodeify(require('glob'));
var chalk         = require('chalk');
var mkdirp        = denodeify(require('mkdirp'));
var child_process = require('child_process');
var spawn         = child_process.spawn;
var parse         = require('shell-quote').parse;
var errCount      = 0,
    writeCount    = 0,
    curDir        = process.cwd();
var customArgs    = [];
var argv          = minimist(process.argv.slice(2), {
  alias: {
    input: 'i',
    output: 'o',
    mask: 'm',
    debug: 'd',
    flatten: 'f'
  },
  boolean: ['debug'],
  default: {
    input: curDir,
    output: null,
    mask: '**/*.{mp4,avi,mkv,m4v,ts,mov}',
    debug: false,
    flatten: false
  },
  // Custom arguments for Handbrake
  // TODO: This doesn't seen to work with non-boolean arguments
  unknown: function (arg) {
    customArgs.push(arg);
    // Add --dry-run to argv as it determines whether some things are run
    return /\-\-dry\-run/i.test(arg);
  }
});

var bar;
var inputDir = !path.isAbsolute(argv['input']) ? path.resolve(curDir, argv['input']) : path.normalize(argv['input']);
var fileMask = argv['mask'];
var filePattern = path.normalize(inputDir + path.sep + fileMask);

function repeat(str, count) {
  'use strict';
  if (str == null) {
    throw new TypeError('can\'t convert ' + str + ' to object');
  }
  var str = '' + str;
  count = +count;
  if (count != count) {
    count = 0;
  }
  if (count < 0) {
    throw new RangeError('repeat count must be non-negative');
  }
  if (count == Infinity) {
    throw new RangeError('repeat count must be less than infinity');
  }
  count = Math.floor(count);
  if (str.length == 0 || count == 0) {
    return '';
  }
  // Ensuring count is a 31-bit integer allows us to heavily optimize the
  // main part. But anyway, most current (August 2014) browsers can't handle
  // strings 1 << 28 chars or longer, so:
  if (str.length * count >= 1 << 28) {
    throw new RangeError('repeat count must not overflow maximum string size');
  }
  var rpt = '';
  for (;;) {
    if ((count & 1) == 1) {
      rpt += str;
    }
    count >>>= 1;
    if (count == 0) {
      break;
    }
    str += str;
  }
  return rpt;
}

function msg(message, type) {
  if (!type) {
    type = 'error';
  }
  var isError = type === 'error',
      headerColor = (isError || type === 'failure') ?
          'bgRed' : (type === 'info' ? 'bgCyan' : (type === 'debug' ? 'bgBlue' : 'bgGreen')),
      isWrite = type === 'write',
      header = chalk[headerColor].gray.bold(type.toUpperCase()),
      hasBars = (type === 'success') || isError || (type === 'failure'),
      barColor = (isError || type === 'failure') ? 'red' : 'green',
      colorBar = chalk[barColor](bar);
  if (argv['debug'] && type === 'bar') {
    console.log(message)
  } else if (argv['debug'] || type !== 'debug') {
    if (hasBars) { console.log(colorBar); }
    console.log(header + chalk.white.bold('\t' + message));
    if (hasBars) { console.log(colorBar); }
  }
  if (isError) {
    errCount += 1;
  } else if (isWrite && !argv['dry-run']) {
    writeCount += 1;
  }
}

function children(cmd, args, file, dir, mute) {
  var debug = argv['debug'] && !mute;
  var buff = '', errs = '';
  var child = spawn(cmd, args, {
    cwd: dir || curDir
  });
  return new Promise(function (acc, rej) {
    if (debug) {
      msg('[Output: ' + cmd + '] ' + file, 'debug');
      console.log(chalk.gray(bar));
    }
    child.stdout.on('data', function (data) {
      data = data.toString();
      buff += data;
      if (debug) {
        console.log(data.replace(/^[\s\n]+|[\s\n]+$/, ''));
      }
    });

    child.stderr.on('data', function (data) {
      errs += data.toString();
    });

    child.on('close', function (code) {
      if (code !== 0) {
        rej(new Error('[Child Error] ' + file + "\n\n" + errs));
      } else {
        if (debug) {
          console.log(chalk.gray(bar));
        }
        acc(buff);
      }
    });
  });
}

function transcode(filePath) {
  var filePathNorm = path.normalize(filePath);
  var fileName = path.basename(filePathNorm);
  var filePathDir = path.dirname(filePathNorm);
  // TODO: will change based on custom options
  var destFileName = path.basename(fileName, path.extname(fileName)) + '.mkv';
  var usePath, logFileName, destFilePath;
  if (argv['output']) {
    var outputDir = !path.isAbsolute(argv['output']) ?
        path.relative(curDir, argv['output']) : argv['output'];
    usePath = !argv['flatten'] ?
        // Add relative paths from --input to filePathDir when --o given
        path.resolve(outputDir, path.relative(inputDir, filePathDir)) :
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
  msg('[Start Processing] ' + fileName, 'debug');
  return mkdirp(usePath)
  .then(function () {
    return children('detect-crop', [path.relative(curDir, filePathNorm)], fileName, curDir);
  })
  .then(function (res) {
    var commandLines = res.replace(/\n+$/gm, '');
    var commands = commandLines.split(/\n+/);
    var useCommand = commands[commands.length - 1].replace(/^\s+|\s+$/, '');;
    if (!/^transcode\-video/.test(useCommand)) {
      throw new Error('Invalid command returned for (' + fileName + '): ' + useCommand);
    }
    return useCommand;
  })
  .then(function (command) {
    var useArgs = parse(command);
    useArgs.splice(1, 0, '--output', usePath);
    if (customArgs.length) {
      useArgs.splice.apply(useArgs, [useArgs.length - 1, 0].concat(customArgs));
    }
    var crop = useArgs.indexOf('--crop') + 1;
    if (crop > 0) {
      msg('[Crop: ' + useArgs[crop] + '] ' + fileName, 'info');
    } else {
      throw new Error('[Crop Error] ' + fileName);
    }
    return useArgs;
  })
  .then(function (args) {
    msg('[Transcoding] ' + fileName, 'info');
    return children(args[0], args.slice(1), fileName, curDir);
  })
  .then(function (output) {
    msg('[Stop Processing] ' + fileName, 'debug');
    // Get total running time
    var destRelPath = path.normalize(usePath + path.sep + destFileName);
    if (argv['dry-run']) {
      msg('[SIMULATION] ' + destRelPath, 'write');
    } else {
      return children('query-handbrake-log', ['time', logFileName], destFileName, curDir, true)
      .then(function (log) {
        var totalTime = log.replace(/^\s+|\s+$/, '').match(/^([0-9]{2}\:[0-9]{2}\:[0-9]{2})/)[1];
        msg('[Time: ' + totalTime + '] ' + destRelPath, 'write');
      });
    }
  })
  .catch(function (err) {
    msg(err.message);
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

msg('Scanning for media: ' + filePattern, 'debug');
children('tput', ['cols'], null, null, true)
.then(function (cols) {
  bar = repeat('-', parseInt(cols.trim(), 10));
  return true;
})
.then(function () {
  return glob(filePattern, {});
})
.then(function (files) {
  if (files.length === 0) {
    throw new Error('[No Files Found] ' + filePattern);
  }
  return transcodeAll(files);
}, function (err) {
  throw new Error('[Glob Error] ' + err.message);
})
.catch(function (err) {
  msg(err.message);
});

process.on('exit', function () {
  if (errCount > 0) {
    msg('Encountered ' + errCount + ' error' + (errCount !== 1 ? 's' : '') + '.', 'failure');
    process.reallyExit(1);
  } else if (writeCount <= 0) {
    if (argv['dry-run']) {
      msg('Dry run completed successfully. Did not write any files.', 'success');
    } else {
      msg('Did not write any files.', 'failure');
    }
  } else {
    msg('Created ' + writeCount + ' files. Finished without error.', 'success');
  }
});
