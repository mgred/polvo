let config, config_path;
import path = require('path');
import fs = require('fs');
import util = require('util');
import yaml = require('js-yaml');
import dirs = require('./dirs');

import { argv } from '../cli';

let { error, warn, info, debug } = require('./logger')('utils/config');

if (dirs.pwd != null) {
  if (argv['config-file'] != null) {
    config_path = path.join(dirs.pwd, argv['config-file']);
  } else {
    config_path = path.join(dirs.pwd, "polvo.yml");
  }
}

if (fs.existsSync(config_path)) {
  if (fs.statSync(config_path).isDirectory()) {
    error('Config file\'s path is a directory  ~>', config_path);
    // process.exit()
  } else {
    let config_contents = fs.readFileSync(config_path, 'utf8');
    config = yaml.safeLoad(config_contents) || {};
  }
} else {
  error('Config file not found ~>', config_path);
}
// process.exit()

let parse_config = function () {
  // server
  let tmp;
  if (config.server != null) {

    if (config.server.port == null) {
      config.server.port = 3000;
    }
    if (config.server.root) {
      let root = config.server.root = path.join(dirs.pwd, config.server.root);
      if (!fs.existsSync(root)) {
        if (argv.server) {
          return error('Server\'s root dir does not exist ~>', root);
        }
      }
    } else if (argv.server) {
      return error('Server\'s root not set in in config file');
    }
  } else if (argv.server) {
    return error('Server\'s config not set in config file');
  }

  // input
  if (config.input != null && config.input.length) {
    for (let index = 0; index < config.input.length; index++) {
      let dirpath = config.input[index];
      tmp = config.input[index] = path.join(dirs.pwd, dirpath);
      if (!fs.existsSync(tmp)) {
        return error('Input dir does not exist ~>', dirs.relative(tmp));
      }
    }
  } else {
    return error('You need at least one input dir in config file');
  }

  // output
  if (config.output != null) {

    let all, key, reg, res;
    if (config.output.js != null) {
      config.output.js = path.join(dirs.pwd, config.output.js);

      reg = /\{(\w+)\}/g;
      while ((res = reg.exec(config.output.js)) != null) {
        [all, key] = Array.from(res);
        config.output.js = config.output.js.replace(all, process.env[key]);
      }

      tmp = path.dirname(config.output.js);
      if (!fs.existsSync(tmp)) {
        return error('JS\'s output dir does not exist ~>', dirs.relative(tmp));
      }
    }

    if (config.output.css != null) {
      config.output.css = path.join(dirs.pwd, config.output.css);

      reg = /\{(\w+)\}/g;
      while ((res = reg.exec(config.output.css)) != null) {
        [all, key] = Array.from(res);
        config.output.css = config.output.css.replace(all, process.env[key]);
      }

      tmp = path.dirname(config.output.css);
      if (!fs.existsSync(tmp)) {
        return error('CSS\'s output dir does not exist ~>', dirs.relative(tmp));
      }
    }
  } else {
    return error('You need at least one output in config file');
  }

  // alias
  if (config.alias != null) {
    for (let name in config.alias) {
      let location = config.alias[name];
      let abs_location = path.join(dirs.pwd, location);
      if (!fs.existsSync(abs_location)) {
        return error(`Alias '${ name }' does not exist ~>`, location);
      } else {
        config.alias[name] = dirs.relative(abs_location);
      }
    }
  } else {
    config.alias = {};
  }

  // minify
  if (config.minify == null) {
    config.minify = {};
  }
  if (config.minify.js == null) {
    config.minify.js = true;
  }
  if (config.minify.css == null) {
    config.minify.css = true;
  }

  // boot
  if (config.boot == null) {
    return error("Boot module not informed in config file");
  } else {
    config.boot = path.join(dirs.pwd, config.boot);
    return config.boot = dirs.relative(config.boot);
  }
};

// if config exists
if (config != null) {
  parse_config();
}

export default config;
