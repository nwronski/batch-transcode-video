'use strict';

var say = require('./say');
var isFunction = require('./util').isFunction;
var Promise = require('promise');
var child_process = require('child_process');
var spawn = child_process.spawn;
var exec = child_process.exec;
var environment = require('./environment');

function windowsCommand(cmd, args) {
  return [cmd].concat(args.map(function (arg) {
    return (/^[^\-]/.test(arg) ? '"' + arg + '"' : arg
    );
  })).join(' ');
}

module.exports = function childPromise(cmd, args, file, dir, mute, callback) {
  var buff = '',
      errs = '';
  return new Promise(function (acc, rej) {
    var opts = {
      cwd: dir
    };
    var child;

    var dataHandler = function dataHandler(data) {
      data = data.toString().trim();
      // Only keep the last packet of data to prevent large
      // amount of output being saved in memory
      buff = !/\n/.test(data) ? buff + data : data;
      if (isFunction(callback)) {
        callback(data);
      }
    };

    var stdErrHandler = function stdErrHandler(data) {
      errs += data.toString();
    };

    var errHandler = function errHandler(err) {
      var e = new Error('Child process encountered an error.');
      e.additional = err.toString().trim();
      e.file = file;
      rej(e);
    };

    var closeHandler = function closeHandler(code) {
      if (code !== 0) {
        errHandler(errs);
      } else {
        acc(buff);
      }
    };

    child = environment.windows ?
    // Use exec() and special escape syntax for Windows
    exec(windowsCommand(cmd, args), opts) :
    // Use spawn() and normal syntax for non-Windows
    spawn(cmd, args, opts);

    child.stdout.on('data', dataHandler);
    child.stderr.on('data', stdErrHandler);
    child.on('close', closeHandler);
    child.on('error', errHandler);
  });
};
//# sourceMappingURL=child-promise.js.map
