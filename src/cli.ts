import * as yargs from 'yargs';
import * as colors from 'colors';
import * as path from 'path';
import * as version from './utils/version';
import { readConfig } from './utils/config_';

let usage = `\
Polvo ${ `v${ version }`.grey }
${ 'Polyvalent cephalopod mollusc'.grey }

${ 'Usage:' }
  polvo [${ 'options'.green }] [${ 'params'.green }]\
`;

let examples = `\
Examples:
  polvo -c
  polvo -cs
  polvo -w
  polvo -ws
  polvo -wsf custom-config-file.yml\
`;

export const cli = yargs(process.argv.slice(0))
  .usage(usage)

  .alias('w', 'watch')
  .boolean('w')
  .describe('w', "Start watching/compiling in dev mode")
  
  .alias('c', 'compile')
  .boolean('c')
  .describe('c', "Compile project in development mode")
  
  .alias('r', 'release')
  .boolean('r')
  .describe('r', "Compile project in release mode")
  
  .alias('s', 'server')
  .boolean('s')
  .describe('s', "Serves project statically, options in config file")

  .alias('f', 'config-file')
  .string('f')
  .describe('f', "Path to a different config file")
  .coerce('f', readConfig)

  .alias('b', 'base')
  .string('b')
  .describe('b', 'Path to app\'s root folder (when its not the current)')
  .coerce('b', path.resolve)
  .default('b', path.resolve('.'))

  .alias('x', 'split')
  .boolean('x')
  .describe('x', 'Compile files individually - useful for tests coverage')

  .help('help')

  .example('$0 -cs', 'Compile all files, serve them locally')
  .example('$0 -ws', 'Compile/Watch all files, serve them locally')
  .example('$0 -wsf custom-config-file.yml', '... with a custom config');


export function help() {
  return `${ cli.showHelp() }\n${ examples }`;
}
