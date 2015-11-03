export default class TranscodeError extends Error {
  constructor(message, file, additional = '') {
    super();
    this.message = message;
    this.file = file;
    this.additional = additional;
  }

  toString() {
    return [`[TranscodeError: ${this.message}]`, `File: ${this.file}`, this.additional].join("\n");
  }
}
