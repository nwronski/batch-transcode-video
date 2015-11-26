"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TranscodeError = (function (_Error) {
  _inherits(TranscodeError, _Error);

  function TranscodeError(message, file) {
    var additional = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

    _classCallCheck(this, TranscodeError);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TranscodeError).call(this));

    _this.message = message;
    _this.file = file;
    _this.additional = additional;
    return _this;
  }

  _createClass(TranscodeError, [{
    key: "toString",
    value: function toString() {
      return ["[TranscodeError: " + this.message + "]", "File: " + this.file, this.additional].join("\n");
    }
  }]);

  return TranscodeError;
})(Error);

exports.default = TranscodeError;
