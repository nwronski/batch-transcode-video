'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.isFunction = isFunction;
exports.isString = isString;
exports.type = type;
exports.repeat = repeat;
exports.splitter = splitter;

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

function repeat(str, count) {
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

;

function splitter(str, left, len) {
  var MAX_LENGTH = len || 40;
  var words = str.split(' '),
      built = '',
      line = [],
      lineLen = 0;
  var makeLine = function makeLine() {
    return (!left ? '\t\t' : '') + line.join(' ') + '\n';
  };
  var addLine = function addLine() {
    if (lineLen > 0) {
      built += makeLine();
      lineLen = 0;
      line = [];
    }
  };
  var extendLine = function extendLine(w) {
    lineLen += w.length;
    line.push(w);
  };
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
