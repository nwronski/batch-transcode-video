'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = childPromise;

var _say = require('./say');

var say = _interopRequireWildcard(_say);

var _util = require('./util');

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

var _child_process = require('child_process');

var _environment = require('./environment');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function windowsCommand(cmd, args) {
  return [cmd].concat(args.map(function (arg) {
    return (/^[^\-]/.test(arg) ? '"' + arg + '"' : arg
    );
  })).join(' ');
}

function childPromise(cmd, args, file, dir, mute, callback) {
  var buff = '',
      errs = '';
  return new _promise2.default(function (acc, rej) {
    var opts = {
      cwd: dir
    };
    var child;

    var dataHandler = function dataHandler(data) {
      data = data.toString().trim();
      // Only keep the last packet of data to prevent large
      // amount of output being saved in memory
      buff = !/\n/.test(data) ? buff + data : data;
      if ((0, _util.isFunction)(callback)) {
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

    child = _environment.windows ?
    // Use exec() and special escape syntax for Windows
    (0, _child_process.exec)(windowsCommand(cmd, args), opts) :
    // Use spawn() and normal syntax for non-Windows
    (0, _child_process.spawn)(cmd, args, opts);

    child.stdout.on('data', dataHandler);
    child.stderr.on('data', stdErrHandler);
    child.on('close', closeHandler);
    child.on('error', errHandler);
  });
};
//# sourceMappingURL=child-promise.js.map
