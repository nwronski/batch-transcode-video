export default class TranscodeError extends Error {
  constructor(message, file, additional = '') {
    super();
    this._message = message;
    this.file = file;
    this.additional = additional;
    // If we get ENOENT then we might be missing the video_transcoding gem
    if (/ENOENT/i.test('' + this.additional)) {
      this.additional += '\nHave you run "gem install video_transcoding"?';
    }
    this.message = [`[TranscodeError: ${this._message}]`, `File: ${this.file}`, this.additional].join("\n");
  }

  toString() {
    return this.message;
  }
}
