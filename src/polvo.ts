import { install } from 'source-map-support';
import { build, release } from './core/compiler';
import server from './core/server';

install({handleUncaughtExceptions: false });

export default function (options, io) {

  if (options.compile || options.watch) {
    build();
    if (options.server) {
      server();
    }
  } else if (options.release) {
    release(() => {
      if (options.server) {
        server();
      }
    });
  }
}

/*
export function close() {
  let files = require('./core/files');
  let server = require('./core/server');

  files.close_watchers();
  return server.close();
}

export function read_config() {
  return require('./utils/config');
}
*/
