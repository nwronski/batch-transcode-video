export function isFunction(obj) {
  return type(obj) === 'function';
};

export function isString(obj) {
  return type(obj) === 'string';
};

export function type(obj) {
  let typeMatches = Object.prototype.toString.call(obj).match(/\[object\s([a-z]+)\]/i);
  return typeMatches != null ? typeMatches[1].toLowerCase() : null;
};

export function strToMilliseconds(strTime) {
  let [_, h, m, s] = strTime.toString().match(/([0-9]{2})\:([0-9]{2})\:([0-9]{2})/);
  return ((h * Math.pow(60, 3)) + (m * Math.pow(60, 2)) + (s * 60)) * 1000;
};

export function millisecondsToStr(ms) {
  let parts = [0, 0, 0];
  let partLabels = ['h', 'm', 's']
  if (isANumber(ms) && ms > 1000) {
    ms /= 1000;
    parts = [
      Math.floor(ms / Math.pow(60, 2)),
      Math.floor((ms % Math.pow(60, 2)) / 60),
      Math.round(ms % 60)
    ];
  }
  return parts.map((p, i) => `${padTo(p.toString())}${partLabels[i]}`).join(' ');
};

export function fractionToPercent(frac) {
  let [min, max] = [0.0, 100.0];
  let percent = isANumber(frac) ? Math.max(Math.min(max * frac, max), min) : min;
  return padTo(percent.toPrecision(5), '0', 6, 0);
};

export function isANumber(num) {
  return !Number.isNaN(Number.parseFloat(num)) && isFinite(num);
};

// dir: 0 = right, 1 = left
export function padTo(str, char = '0', count = 2, dir = 1) {
  let right = dir === 0;
  let pad = char.repeat(count);
  let chars = right ? `${str}${pad}` : `${pad}${str}`;
  return right ? chars.slice(0, count) : chars.slice(-1 * count);
};

export function splitter(str, left, len) {
  const MAX_LENGTH = len || 40;
  let words = str.split(' '), built = '', line = [], lineLen = 0;
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
    if ((lineLen + word.length) > MAX_LENGTH) {
      addLine();
    }
    extendLine(word);
  });
  addLine();
  return built;
};
