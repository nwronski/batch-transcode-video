module.exports = function splitter(str, center, len) {
  var MAX_LENGTH = len || 40;
  var words = str.split(' '), built = '', line = [], lineLen = 0;
  var makeLine = function makeLine() {
    return (center ? '\t\t' : '') + line.join(' ') + '\n';
  }
  var addLine = function addLine() {
    if (lineLen > 0) {
      built += makeLine();
      lineLen = 0;
      line = [];
    }
  }
  var extendLine = function extendLine(w) {
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
