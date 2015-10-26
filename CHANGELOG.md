# Change Log
All notable changes to this project will be documented in this file.

## [Unreleased][unreleased]

## [v0.2.1] - 2015-10-25
### Fixed
- Unable to `npm install -g batch-transcode-video` due to missing `promise` dependency in `package.json`.

## [v0.2.0] - 2015-10-25
### Fixed
- Unable to `npm install -g batch-transcode-video` due to missing files error.

## [v0.1.1] - 2015-10-25
### Added
- `--diff` flag
  Enable this option if you only want to transcode source files that do not exist already in the `output` folder.
  - If a destination file already exists in the `output` directory:
    -  And `diff` is **enabled**, a message will be generated letting you know that the file was skipped (unless `quiet` is enabled).
    - And `diff` is **not enabled**, an error will be generated letting you know that the file already exists.
  - If you want to transcode a batch of videos in-place (i.e.: without specifying an `output` directory) then you should enabled this option to prevent errors from being generated when the source and destination file names have the same extension.
    - For example: trying to transcode a `.mkv` video into a `.mkv` video without supplying an external `output` directory will generate an error unless you specify the `diff` flag.

## [v0.1.0] - 2015-10-25
### Added
- `--flatten` flag
  Do not preserve relative directory structure in output directory. If this is enabled, the base output folder will contain all transcoded videos. Note: this option has no effect unless you specify an `output` directory.
- `--quiet` flag
  Log only file writes, errors, and finish (e.g.: success, failure) messages.

[unreleased]: https://github.com/nwronski/batch-transcode-video/compare/v0.2.1...HEAD
[v0.2.1]: https://github.com/nwronski/batch-transcode-video/compare/v0.2.0...v0.2.1
[v0.2.0]: https://github.com/nwronski/batch-transcode-video/releases/tag/v0.2.0
