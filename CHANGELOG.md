# Change Log
All notable changes to this project will be documented in this file.

## [Unreleased][unreleased]

## [v1.0.3] - 2015-11-09
### Added
- New metrics added to CLI mode summary output:
  - Show average bitrate for successful writes.
  - Show total and average running time.
  - Show speed in MB/s.
- New `--force` flag. If crop detection returns conflicting crop values then just use the least extreme crop value and continue transcoding.

## [v1.0.2] - 2015-11-08
### Fixed
- Fixed `query-handbrake-log` file path bug in Windows.
- Fixed empty summary bar display bug that caused no summary bar to appear when there were no video files found for the arguments given.

## [v1.0.1] - 2015-11-08
### Added
- Take an educated guess at the current percentage and remaining time before there is any data from the child process that can be used to estimate progress.

### Changed
- Generate an error when the `detect-crop` returns multiple crop values for a video.

### Fixed
- Fixed false positive errors in OS X environment.

## [v1.0.0] - 2015-11-08
### Added
- Added back `--quiet` and `--debug` flags to new ES2015 version of CLI.
  - `--debug` mode disables progress indicator and then streams child process to master `stdout`.
  - `--quiet` mode now prevents **any** logging to stdout and will only exit `0` on success or `1` on error

### Fixed
- Lots of cleanup for Progress class.
- Get `VideoFile` class working with Windows again.
- Fixed broken help flag in CLI mode.
- Move Windows-specific functions to `util.js`.
- Fixed false positive errors in Windows environment.
- Fixed glob error message details.

## [v1.0.0-beta] - 2015-11-07
### Added
- You can now use the module:
  - From the CLI as `batch-transcode-video` (default global option).
  - Require the ES5 compatible `dist/` files (default local option).
  - Require the raw ES2015 files from the root folder `index.js` or `index-cli.js` for the command line version.
- Fancy new CLI:
  - Added progress bars to output.
  - Added summary that is displayed on exiting the process.
  - Add colored summary bar to summary output.
  - Estimate remaining time and current percent completion for each file and the entire batch operation even when no data is available from the child process.

### Changed
- Entire repo rewritten to use ES2015
- Added `grunt` and `grunt watch` tasks to build ES2015 source

### Fixed
- Do not increment time unless running.
- Save stop time when main class errors out.
- Fix percent and time calculations.

## [v0.3.1] - 2015-10-27
### Fixed
- Entire `stdout` buffer was being saved to memory for each child process which was a large amount of data for each transcoding operation. Now only the most recent chunk of lines from a child process `stdout` is saved in memory.

## [v0.3.0] - 2015-10-26
### Added
- Now functions correctly in Windows. Tested in Windows 10 x64.
- Support for `--input` and `--output` options containing Windows paths that have spaces.
  ```
  > batch-transcode-video --input my` videos --output other` folder\temp
  ```
- Generate an error for unknown options.
  ```
  > batch-transcode-video --hat --debug
  ERROR   Unrecognized command --hat provided.
  If you would like to supply custom options to transcode-video then put
  them at end of the command after a double dash "--". For example to pass
  the  "--dry-run" command to transcode-video:

  batch-transcode-video --input my_videos/ -- --dry-run
  ```
- Added `--help` option to view the manual in the terminal.

### Fixed
- Capture child process error events. Previously unhandled errors (e.g. `ENOENT`) when spawning child processes.
- Support absolute source paths for `--input` and `--output` options.

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

[unreleased]: https://github.com/nwronski/batch-transcode-video/compare/v1.0.3...HEAD
[v1.0.3]: https://github.com/nwronski/batch-transcode-video/compare/v1.0.2...v1.0.3
[v1.0.2]: https://github.com/nwronski/batch-transcode-video/compare/v1.0.1...v1.0.2
[v1.0.1]: https://github.com/nwronski/batch-transcode-video/compare/v1.0.0...v1.0.1
[v1.0.0]: https://github.com/nwronski/batch-transcode-video/compare/v1.0.0-beta...v1.0.0
[v1.0.0-beta]: https://github.com/nwronski/batch-transcode-video/compare/v0.3.1...v1.0.0-beta
[v0.3.1]: https://github.com/nwronski/batch-transcode-video/compare/v0.3.0...v0.3.1
[v0.3.0]: https://github.com/nwronski/batch-transcode-video/compare/v0.2.1...v0.3.0
[v0.2.1]: https://github.com/nwronski/batch-transcode-video/compare/v0.2.0...v0.2.1
[v0.2.0]: https://github.com/nwronski/batch-transcode-video/releases/tag/v0.2.0
