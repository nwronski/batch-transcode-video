var chalk         = require('chalk');
var options       = require('./options');
var Promise       = require('promise');

function say(message, type) {
  var shouldEmit = true;
  var headerBg;
  type = type || 'error';
  switch (type) {
    case 'write':
      if (!options['dry-run']) {
        say.writeCount += 1;
      }
    case 'success':
      headerBg = 'bgGreen';
      break;
    case 'debug':
      shouldEmit = options['debug'];
      headerBg = 'bgBlue';
      break;
    case 'info':
      shouldEmit = !options['quiet'];
      headerBg = 'bgCyan';
      break;
    case 'error':
      say.errCount += 1;
    case 'failure':
    default:
      headerBg = 'bgRed';
      break;
  }
  if (shouldEmit) {
    console.log(chalk[headerBg].gray.bold(type.toUpperCase()) + chalk.white.bold('\t' + message));
  }
}

say.errCount      = 0;
say.writeCount    = 0;

module.exports = say;
