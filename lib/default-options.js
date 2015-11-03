import path from 'path';
let curDir = process.cwd();
export default {
  // Input folder
  input: curDir,
  // Output folder
  output: null,
  // Search pattern for glob in input directory
  mask: '**' + path.sep + '*.{mp4,avi,mkv,m4v,ts,mov}',
  // Verbose logging
  debug: false,
  // Do not preserve relative directory structure in output directory
  flatten: false,
  // Log only writes, errors, and finish (success, failure) message
  quiet: false,
  // Only try to transcode videos that do not exist in the output directory
  diff: false,
  help: false
};
