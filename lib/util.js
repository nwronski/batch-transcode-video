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
  return ((h * 60**3) + (m * 60**2) + (s * 60)) * 1000;
};

export function millisecondsToStr(ms) {
  let parts = [0, 0, 0];
  if (isANumber(ms)) {
    ms /= 1000;
    parts = [
      Math.floor(ms / 60**2),
      Math.floor((ms % 60**2) / 60),
      Math.round(ms % 60)
    ];
  }
  return parts.map((p) => padTo(p.toString())).join(':');
};
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
