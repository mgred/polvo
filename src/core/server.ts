import * as path from 'path';
import * as fs from 'fs';
import * as connect from 'connect';
import serve_static from 'serve-static';
import io from 'socket.io';
//import dirs = require('../utils/dirs');
import config from '../utils/config';
//import * as sourcemaps from '../utils/sourcemaps';

let { error, warn, info, debug, log } = require('../utils/logger')('core/server');

let app: any = null;
let refresher: any = null;

export default function (root: string, port: string, refresh = false) {
  //let { root, port } = config.server;

  const index = path.join(root, 'index.html');
  const address = `http://localhost:${ port }`;

  // simple static server with 'connect'
  app = connect()
    .use(serve_static(root))
    .use((req, res) => {
      if (~req.url.indexOf('.')) {
        res.statusCode = 404;
        return res.end(`File not found: ${ req.url }`);
      } else {
        return res.end(fs.readFileSync(index, 'utf-8'));
      }
    })
    .listen(port);

  log(`♫  ${ address }`);

  if (refresh) {
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

export class Server {
  private server: any;
  private refresher: any;

  constructor(private root: string, private port: string, refresh = false) {
    this.bootstrap();
    refresh && (this.refresher = io.listen(53211, { 'log level': 1 }))
  }

  public close() {
    if (this.server) {
      this.server.close();
    }

    if(this.refresher) {
      return this.refresher.server.close();
    }
  }

  public reload(type: string) {
    if(this.refresher) {
      return this.refresher.sockets.emit('refresh', { type });
    }
  }

  private bootstrap() {
    const index = path.join(this.root, 'index.html');
    const address = `http://localhost:${ this.port }`;

    // simple static server with 'connect'
    this.server = connect()
      .use(serve_static(this.root))
      .use((req, res) => {
        if (~req.url.indexOf('.')) {
          res.statusCode = 404;
          return res.end(`File not found: ${ req.url }`);
        } else {
          return res.end(fs.readFileSync(index, 'utf-8'));
        }
      })
      .listen(this.port);

    log(`♫  ${ address }`);
  }
}
