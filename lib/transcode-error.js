export default class TranscodeError extends Error {
  constructor(message, file, additional = '') {
    super();
    this._message = message;
    this.file = file;
    this.additional = additional;
    this.message = [`[TranscodeError: ${this._message}]`, `File: ${this.file}`, this.additional].join("\n");
  }

  toString() {
    return this.message;
  }
}
