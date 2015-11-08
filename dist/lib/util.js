'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

exports.isFunction = isFunction;
exports.isString = isString;
exports.type = type;
exports.strToMilliseconds = strToMilliseconds;
exports.millisecondsToStr = millisecondsToStr;
exports.fractionToPercent = fractionToPercent;
exports.isANumber = isANumber;
exports.padTo = padTo;
exports.splitter = splitter;
exports.isWindows = isWindows;
exports.windowsCommand = windowsCommand;

function isFunction(obj) {
  return type(obj) === 'function';
}

;

function isString(obj) {
  return type(obj) === 'string';
}

;

function type(obj) {
  var typeMatches = Object.prototype.toString.call(obj).match(/\[object\s([a-z]+)\]/i);
  return typeMatches != null ? typeMatches[1].toLowerCase() : null;
}

;

function strToMilliseconds(strTime) {
  var _strTime$toString$match = strTime.toString().match(/([0-9]{2})\:([0-9]{2})\:([0-9]{2})/);

  var _strTime$toString$match2 = _slicedToArray(_strTime$toString$match, 4);

  var _ = _strTime$toString$match2[0];
  var h = _strTime$toString$match2[1];
  var m = _strTime$toString$match2[2];
  var s = _strTime$toString$match2[3];

  return (h * Math.pow(60, 3) + m * Math.pow(60, 2) + s * 60) * 1000;
}

;

function millisecondsToStr(ms) {
  var parts = [0, 0, 0];
  var partLabels = ['h', 'm', 's'];
  if (isANumber(ms) && ms > 1000) {
    ms /= 1000;
    parts = [Math.floor(ms / Math.pow(60, 2)), Math.floor(ms % Math.pow(60, 2) / 60), Math.round(ms % 60)];
  }
  return parts.map(function (p, i) {
    return '' + padTo(p.toString()) + partLabels[i];
  }).join(' ');
}

;

function fractionToPercent(frac) {
  var min = 0.0;
  var max = 100.0;

  var percent = isANumber(frac) ? Math.max(Math.min(max * frac, max), min) : min;
  return padTo(percent.toPrecision(5), '0', 6, 0);
}

;

function isANumber(num) {
  return !Number.isNaN(Number.parseFloat(num)) && isFinite(num);
}

;

// dir: 0 = right, 1 = left

function padTo(str) {
  var char = arguments.length <= 1 || arguments[1] === undefined ? '0' : arguments[1];
  var count = arguments.length <= 2 || arguments[2] === undefined ? 2 : arguments[2];
  var dir = arguments.length <= 3 || arguments[3] === undefined ? 1 : arguments[3];

  var right = dir === 0;
  var pad = char.repeat(count);
  var chars = right ? '' + str + pad : '' + pad + str;
  return right ? chars.slice(0, count) : chars.slice(-1 * count);
}

;

function splitter(str, left, len) {
  var MAX_LENGTH = len || 40;
  var words = str.split(' '),
      built = '',
      line = [],
      lineLen = 0;
  function makeLine() {
    return (!left ? '\t\t' : '') + line.join(' ') + '\n';
  }
  function addLine() {
    if (lineLen > 0) {
      built += makeLine();
      lineLen = 0;
      line = [];
    }
  }
  function extendLine(w) {
    lineLen += w.length;
    line.push(w);
  }
  words.forEach(function (word) {
    if (lineLen + word.length > MAX_LENGTH) {
      addLine();
    }
    extendLine(word);
  });
  addLine();
  return built;
}

;

function isWindows() {
  return (/^win/i.test(process.platform)
  );
}

;

function windowsCommand(cmd, args) {
  return [cmd].concat(args.map(function (arg) {
    return (/^[^\-]/.test(arg) ? '"' + arg + '"' : arg
    );
  })).join(' ');
}

;
