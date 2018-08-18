let pwd;
import * as path from 'path';
import * as fs from 'fs';

let { error, warn, info, debug, log } = require('./logger')('utils/dirs');
import { argv } from '../cli';

export let root = path.join(__dirname, '..', '..');

if (argv.base != null) {
  if (!fs.existsSync(pwd = path.resolve(argv.base))) {
    error('Dir informed with [--base] option doesn\'t exist ~>', argv.base);
    pwd = null;
  }
} else {
  pwd = path.resolve('.');
}

export { pwd };

export function relative(filepath: string) {
  return path.relative(exports.pwd, filepath);
}
