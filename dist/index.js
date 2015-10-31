'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = batchTranscodeVideo;

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _promise = require('promise');

var _glob2 = require('glob');

var _glob3 = _interopRequireDefault(_glob2);

var _help = require('./lib/help.js');

var _help2 = _interopRequireDefault(_help);

var _transcoder = require('./lib/transcoder.js');

var _transcoder2 = _interopRequireDefault(_transcoder);

var _options = require('./lib/options.js');

var _options2 = _interopRequireDefault(_options);

var _say = require('./lib/say.js');

var say = _interopRequireWildcard(_say);

var _childPromise = require('./lib/child-promise.js');

var _childPromise2 = _interopRequireDefault(_childPromise);

var _util = require('./lib/util.js');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var glob = (0, _promise.denodeify)(_glob3.default);

var curDir = process.cwd();

function batchTranscodeVideo() {
  if (_options2.default['help']) {
    console.log((0, _help2.default)());
    process.exit(0);
  }

  process.on('exit', function () {
    var summary = say.getSummary();
    say.logSummary(summary);
    if (!summary.isSuccess) {
      process.reallyExit(1);
    }
  });

  var filePattern = _path2.default.normalize(_options2.default['input'] + _path2.default.sep + _options2.default['mask']);
  console.log(_chalk2.default.white.bold('- Starting batch operation...'));
  say.notify('Scanning for media using search pattern.', say.DEBUG, filePattern);
  return glob(filePattern, {}).then(function (files) {
    if (files.length === 0) {
      var _e = new Error('No files found for search pattern provided.');
      _e.file = filePattern;
      throw _e;
    }
    say.notify._fileCount = files.length;
    return (0, _transcoder2.default)(files);
  }, function (err) {
    e.file = filePattern;
    e.additional = err.message;
    e.message = 'File system error encountered while scanning for media.';
    throw err;
  }).catch(function (err) {
    say.notify(err);
  }).then(function () {
    process.exit(0);
  });
};
//# sourceMappingURL=index.js.map
