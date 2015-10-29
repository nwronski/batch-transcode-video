module.exports = {
  isString: function isString(o) {
    return Object.prototype.toString.call(o) === '[object String]'
  }
};
