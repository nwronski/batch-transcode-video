import * as say from './say';
import {isFunction} from './util';
import Promise from 'promise';
import {spawn, exec} from 'child_process';
import {windows as isWindows} from './environment';

function windowsCommand(cmd, args) {
  return [cmd].concat(args.map(function (arg) {
    return /^[^\-]/.test(arg) ? '"' + arg + '"' : arg;
  })).join(' ');
}

export default function childPromise(cmd, args, file, dir, mute, callback) {
  var buff = '', errs = '';
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
    }

    var stdErrHandler = function stdErrHandler(data) {
      errs += data.toString();
    }

    var errHandler = function errHandler(err) {
      var e = new Error('Child process encountered an error.');
      e.additional = err.toString().trim();
      e.file = file;
      rej(e);
    }

    var closeHandler = function closeHandler(code) {
      if (code !== 0) {
        errHandler(errs);
      } else {
        acc(buff);
      }
    }

    child = isWindows ?
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
