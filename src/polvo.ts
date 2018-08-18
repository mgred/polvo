require('source-map-support').install({
  handleUncaughtExceptions: false });

export default function (options, io) {

  if (options != null) {
    global.cli_options = options;
  }

  if (io != null) {
    global.__stdout = io.out;
    global.__stderr = io.err;
    global.__nocolor = io.nocolor;
  }

  let cli = require('./cli');
  let version = require('./utils/version');
  let logger = require('./utils/logger')('polvo');

  let { argv } = cli;
  let { error, warn, info, debug, log } = logger;

  if (argv.version) {
    return log(version);
  } else if (argv.compile || argv.watch || argv.release) {

    let config = require('./utils/config');

    if (config != null) {
      let server;
      let compiler = require('./core/compiler');

      if (argv.server && config != null) {
        server = require('./core/server');
      }

      if (argv.compile || argv.watch) {
        compiler.build();
        if (argv.server) {
          server();
        }
      } else if (argv.release) {
        compiler.release(function () {
          if (argv.server) {
            return server();
          }
        });
      }
    }
  } else {
    log(cli.help());
  }

  return module.exports;
};

export function close() {
  let files = require('./core/files');
  let server = require('./core/server');

  files.close_watchers();
  return server.close();
}

export function read_config() {
  return require('./utils/config');
}
