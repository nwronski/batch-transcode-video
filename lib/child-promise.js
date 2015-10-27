var say           = require('./say');
var Promise       = require('promise');
var spawn         = require('child_process').spawn;
module.exports = function childPromise(cmd, args, file, dir, mute) {
  var buff = '', errs = '';
  return new Promise(function (acc, rej) {
    var childErrMsg = '[Child Error] ' + file + "\n\n";

    if (!mute) {
      say('[Output: ' + cmd + '] ' + file + "\n", 'debug');
    }

    var child = spawn(cmd, args, {
      cwd: dir
    });

    function dataHandler(data) {
      data = data.toString();
      buff += data;
      if (!mute) {
        console.log(data.trim() + "\n");
      }
    }

    function stdErrHandler(data) {
      errs += data.toString();
    }

    function errHandler(err) {
      rej(new Error(childErrMsg + err.toString().trim() + "\n"));
    }

    function closeHandler(code) {
      if (code !== 0) {
        errHandler(errs);
      } else {
        acc(buff);
      }
    }

    child.stdout.on('data', dataHandler);
    child.stderr.on('data', stdErrHandler);
    child.on('close', closeHandler);
    child.on('error', errHandler)
  });
};
