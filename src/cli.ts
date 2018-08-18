let options;
import optimist = require('optimist');
import yargs = require('yargs');
import colors = require('colors');
import version = require('./utils/version');

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

if (typeof cli_options !== 'undefined' && cli_options !== null) {
  options = [];
  let object = cli_options || {};
  for (let key in object) {
    let val = object[key];
    options.push(key.length === 1 ? `-${ key }` : `--${ key }`);
    options.push(`${ val }`);
  }
} else {
  options = process.argv.slice(0);
}

let optimistic = yargs(options).usage(usage).alias('w', 'watch').boolean('w').describe('w', "Start watching/compiling in dev mode").alias('c', 'compile').boolean('c').describe('c', "Compile project in development mode").alias('r', 'release').boolean('r').describe('r', "Compile project in release mode").alias('s', 'server').boolean('s').describe('s', "Serves project statically, options in config file").alias('f', 'config-file').string('f').describe('f', "Path to a different config file").alias('b', 'base').describe('b', 'Path to app\'s root folder (when its not the current)').string('b').alias('x', 'split').describe('x', 'Compile files individually - useful for tests coverage').boolean('x').alias('v', 'version').boolean('v').describe('v', 'Show Polvo\'s version').alias('h', 'help').boolean('h').describe('h', 'Shows this help screen');

export let { argv } = optimistic;

export function help() {
  return `${ optimistic.help() }\n${ examples }`;
}
