var say           = require('./say');
var Promise       = require('promise');
var spawn         = require('child_process').spawn;
module.exports = function childPromise(cmd, args, file, dir, mute) {
  var buff = '', errs = '';
  var child = spawn(cmd, args, {
    cwd: dir
  });
  return new Promise(function (acc, rej) {
    if (!mute) {
      say('[Output: ' + cmd + '] ' + file + "\n", 'debug');
    }
    child.stdout.on('data', function (data) {
      data = data.toString();
      buff += data;
      if (!mute) {
        console.log(data.trim() + "\n");
      }
    });

    child.stderr.on('data', function (data) {
      errs += data.toString();
    });

    child.on('close', function (code) {
      if (code !== 0) {
        rej(new Error('[Child Error] ' + file + "\n\n" + errs));
      } else {
        acc(buff);
      }
    });
  });
};
