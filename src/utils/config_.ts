import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../Config';
import { defaultsDeep } from 'lodash';

export const CONFIG: Config = {
  alias: {},
  input: [],
  minify: {
    js: true,
    css: true
  },
  output: {},
  server: {
    port: 3000
  }
};

export function readConfig(file: string): Config {
  if (fs.existsSync(file)) {
    if (fs.statSync(file).isDirectory()) {
      throw new Error("Config file's path is a directory  ~>" + file);
    }
    const config_contents = fs.readFileSync(file, 'utf8');
    return (yaml.safeLoad(config_contents) || {}) as Config;
  }
  throw new Error('Config file not found ~>' + file);
}

export function parseConfig(config: Config, options: any) {
  // merge defaults
  config = defaultsDeep({}, config, CONFIG);

  const { server, input, output } = config;

  // server
  if (options.server) {
    const root = path.join(options.base, server.root || '');
    (fs.existsSync(root) && (server.root = root)) ||
      new Error(`${root} does not exist`);
  }

  // input
  if (Array.isArray(input) && !!input.length) {
    // all inputs must be an existing path
    for (const i in input) {
      const inputPath = path.join(options.base, input[i]);
      if (!fs.existsSync(inputPath)) {
        // error input path does not exist
      }
      input[i] = inputPath;
    }
  }

  // Output
  if (output && typeof output === 'object') {
    for (const o in ['css', 'js']) {
      const p = path.join(options.base, o);
      output[o] &&
        fs.existsSync(path.dirname(p)) &&
        (output[o] = parseOutputPath(p));
    }
  } else {
    // error no output was specified
  }

  return config;
}

function parseOutputPath(outputPath: string): string | undefined {
  // Replace ENV variables in file path.
  const reg = /\{(\w+)\}/g;
  let res;
  while ((res = reg.exec(outputPath)) != null) {
    const [all, key] = Array.from(res);
    const var_ = process.env[key];
    if (!!var_) {
      outputPath = outputPath.replace(all, var_);
    }
  }
  return outputPath;
}
