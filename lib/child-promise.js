var say           = require('./say');
var Promise       = require('promise');
var child_process = require('child_process');
var spawn         = child_process.spawn;
var exec          = child_process.exec;
var environment   = require('./environment');

function windowsCommand(cmd, args) {
  return [cmd].concat(args.map(function (arg) {
    return /^[^\-]/.test(arg) ? '"' + arg + '"' : arg;
  })).join(' ');
}

module.exports = function childPromise(cmd, args, file, dir, mute) {
  var buff = '', errs = '';
  return new Promise(function (acc, rej) {
    var opts = {
     cwd: dir
   };
    var childErrMsg = '[Child Error] ' + file + "\n\n";
    var child;

    var dataHandler = function dataHandler(data) {
      data = data.toString().trim();
      // Only keep the last packet of data to prevent large
      // amount of output being saved in memory
      buff = !/\n/.test(data) ? buff + data : data;
      if (!mute) {
        console.log(data + "\n");
      }
    }

    var stdErrHandler = function stdErrHandler(data) {
      errs += data.toString();
    }

    var errHandler = function errHandler(err) {
      rej(new Error(childErrMsg + err.toString().trim() + "\n"));
    }

    var closeHandler = function closeHandler(code) {
      if (code !== 0) {
        errHandler(errs);
      } else {
        acc(buff);
      }
    }

    if (!mute) {
      say('[Output: ' + cmd + '] ' + file + "\n", 'debug');
    }

    child = environment.windows ?
        // Use exec() and special escape syntax for Windows
        exec(windowsCommand(cmd, args), opts) :
        // Use spawn() and normal syntax for non-Windows
        spawn(cmd, args, opts);

    child.stdout.on('data', dataHandler);
    child.stderr.on('data', stdErrHandler);
    child.on('close', closeHandler);
    child.on('error', errHandler)
  });
};
