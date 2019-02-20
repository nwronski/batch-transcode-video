import path from 'path';
let curDir = process.cwd();
export default {
  // Input folder
  input: curDir,
  // Output folder
  output: null,
  // Search pattern for glob in input directory
  mask: '**' + path.sep + '*.{mp4,avi,mkv,m4v,ts,mov,vob}',
  // Verbose logging
  debug: false,
  // Do not preserve relative directory structure in output directory
  flatten: false,
  // No progress or summary information logged to console.
  quiet: false,
  // Only try to transcode videos that do not exist in the output directory
  diff: false,
  // If crop detection returns multiple values then take the least extreme crop
  force: false,
  // Never delete any output files, no matter what happens
  keep: false,
  help: false
};
