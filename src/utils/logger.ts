import util = require('util');
import colors = require('colors');

// dirs module is required above to avoid circular-loop

let dirs = null;

let log_to_stdout = function(args) {
  args = [].concat(args);

  if (typeof __stdout !== 'undefined' && __stdout !== null) {
    let msg = args.join(' ');
    if (typeof __nocolor !== 'undefined' && __nocolor !== null && __nocolor) {
      msg = msg.stripColors;
    }
    return __stdout(msg);
  } else {
    return console.log.apply(null, args);
  }
};

let log_to_stderr = function(args) {
  args = [].concat(args);

  if (typeof __stderr !== 'undefined' && __stderr !== null) {
    let msg = args.join(' ');
    if (typeof __nocolor !== 'undefined' && __nocolor !== null && __nocolor) {
      msg = msg.stripColors;
    }
    return __stderr(msg);
  } else {
    return console.error.apply(null, args);
  }
};

export default function(alias) {
  if (alias == null) {
    alias = '';
  }
  dirs = require('./dirs');

  return {
    error(msg, ...args) {
      return log_to_stderr(['error'.bold.red, msg.grey].concat(args));
    },

    warn(msg, ...args) {
      return log_to_stderr(['warn'.bold.yellow, msg.grey].concat(args));
    },

    info(msg, ...args) {
      return log_to_stdout(['info'.bold.cyan, msg.grey].concat(args));
    },

    debug(msg, ...args) {
      args = ['debug'.magenta, msg.grey].concat(args);
      if (alias !== '') {
        args.unshift(alias.inverse);
      }
      return log_to_stdout(args);
    },

    log(msg, ...args) {
      return log_to_stdout([msg].concat(args));
    },

    file: {
      created(filepath) {
        return log_to_stdout(`+ ${dirs.relative(filepath)}`.green);
      },

      changed(filepath) {
        return log_to_stdout(`• ${dirs.relative(filepath)}`.yellow);
      },

      deleted(filepath) {
        return log_to_stdout(`- ${dirs.relative(filepath)}`.red);
      },

      compiled(filepath) {
        return log_to_stdout(`✓ ${dirs.relative(filepath)}`.cyan);
      }
    }
  };
}
