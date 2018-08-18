import path = require('path');
import fs = require('fs');
import connect = require('connect');
import serve_static = require('serve-static');
import io = require('socket.io');
import dirs = require('../utils/dirs');
import config = require('../utils/config');
import sourcemaps = require('../utils/sourcemaps');

import { argv } from '../cli';
let { error, warn, info, debug, log } = require('../utils/logger')('core/server');

let app = null;
let refresher = null;

export default function () {
  let { root, port } = config.server;

  let index = path.join(root, 'index.html');

  // simple static server with 'connect'
  app = connect().use(serve_static(root)).use(function (req, res) {
    if (~req.url.indexOf('.')) {
      res.statusCode = 404;
      return res.end(`File not found: ${ req.url }`);
    } else {
      return res.end(fs.readFileSync(index, 'utf-8'));
    }
  }).listen(port);

  let address = `http://localhost:${ port }`;
  log(`♫  ${ address }`);

  if (!argv.r) {
    refresher = io.listen(53211, { 'log level': 1 });
  }

  return module.exports;
};

export function close() {
  if (app != null) {
    app.close();
  }
  return refresher != null ? refresher.server.close() : undefined;
}

export function reload(type) {
  if (refresher == null) {
    return;
  }
  let css_output = path.basename(config.output.css);
  return refresher.sockets.emit('refresh', { type, css_output });
}
