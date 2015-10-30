# batch-transcode-video

A command-line utility for recursively running batch cropping and transcoding operations on a directory of videos. This utility is a wrapper for a a utility called [transcode_video](https://github.com/donmelton/video_transcoding) which itself is a wrapper for trancoding utilities such as [HandbrakeCLI](https://handbrake.fr), [MKVToolNix](https://www.bunkus.org/videotools/mkvtoolnix/), and [mplayer](http://www.mplayerhq.hu/).

## Prerequisites

Requires [Node.js](https://nodejs.org) and [Ruby](https://www.ruby-lang.org).

**Important:** You must have all of the dependencies listed in this section of [the transcode_video README](https://github.com/donmelton/video_transcoding#requirements).

## Installation

This utility can be installed so that it is globally accessible from the terminal as `batch-transcode-video` using the following command.

```
npm i batch-transcode-video -g
```

## Usage

For all the videos found in the `input` directory, this utility will determine if the source should be cropped (e.g.: it has black bars on the top and bottom of the source video) using `detect-crop` and then it will be transcoded using `transcode-video`. After the operation is completed for the current video, the encoding time will be displayed.

This utility can recover from most errors, and as such, it will continue to **sequentially** process source files even if a previous transcoding operation has failed.

A summary is displayed when the entire batch transcoding operation is finished. The summary includes the overall number of errors encountered and files successfully created.

### Instructions

Recursively search for videos to transcode using [video_transcoding](https://github.com/donmelton/video_transcoding). If an `input` **directory** is not specified then the current directory will be used as the input directory.

```
batch-transcode-video --input "video/"
```

Transcoded files will be placed in the same directory as the source unless you specify an `output` directory. The relative folder structure will be maintained in the output directory unless you use the `flatten` flag.

If you want to modify the search pattern that will be used to locate video in the `input` directory, you can specify a [glob](https://github.com/isaacs/node-glob) pattern using the `mask` option.

## Options

- `--help` _Flag: does not accept a value_ (Alias: `-h`)
  You can view the manual for this tool by using this flag in the terminal.
- `--input [path]` (Default: `process.cwd()`) (Alias: `-i`)
  The input **directory** containing the source videos to transcode.
- `--output [path]` (Default: _same directory as source files_) (Alias: `-o`)
  The output **directory** to hold the transcoded videos. If you do not specify an output directory then each transcoded file will be placed in the same directory as its source file. Note: if a source file is already in the same file format as the transcoded video (e.g.: both source and output are both `.mkv`) then you must specify an output directory, as the program will not overwrite existing files.
- `--mask [pattern]` (Default: `**/*.{mp4,avi,mkv,m4v,ts,mov}`) (Alias: `-m`)
  Search pattern to use for input directory. Note that the default pattern will search in nested directories. For more information about what values can be used, see the [glob](https://github.com/isaacs/node-glob) documentation.
- `--diff` _Flag: does not accept a value_ (Default: `false`)
  Enable this option if you only want to transcode source files that do not exist already in the `output` folder.
  - If a destination file already exists in the `output` directory:
    -  And `diff` is **enabled**, a message will be generated letting you know that the file was skipped (unless `quiet` is enabled).
    - And `diff` is **not enabled**, an error will be generated letting you know that the file already exists.
  - If you want to transcode a batch of videos in-place (i.e.: without specifying an `output` directory) then you should enabled this option to prevent errors from being generated when the source and destination file names have the same extension.
    - For example: trying to transcode a `.mkv` video into a `.mkv` video without supplying an external `output` directory will generate an error unless you specify the `diff` flag.
- `--debug` _Flag: does not accept a value_ (Default: `false`)
  Enable verbose logging mode. Will allow you to see the output from the child processes spawned for `detect-crop` and `transcode-video`.
- `--flatten` _Flag: does not accept a value_ (Default: `false`)
  Do not preserve relative directory structure in output directory. If this is enabled, the base output folder will contain all transcoded videos. Note: this option has no effect unless you specify an `output` directory.
- `--quiet` _Flag: does not accept a value_ (Default: `false`)
  Log only file writes, errors, and finish (e.g.: success, failure) messages.

### Providing options to transcode-video

If you want to provide custom options to `trancode-video` then you can place them at the end of your normal options following a `--` and they will be passed directly to the `transcode-video` program. Find a list

```
batch-transcode-video --input "video/" --output "transcoded/" --debug -- --dry-run
```
