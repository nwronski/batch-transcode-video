module.exports = {
  isString: function isString(o) {
    return Object.prototype.toString.call(o) === '[object String]'
  },
  isFunction: function isFunction(o) {
    return Object.prototype.toString.call(o) === '[object Function]'
  }
};
