import fs = require('fs');
import path = require('path');
import _ = require('lodash');
import esprima = require('esprima');
import fsu = require('fs-util');
import dirs = require('../utils/dirs');
import config = require('../utils/config');
import resolve = require('./resolve');

export function dependencies(filepath, raw) {
  let aliased = {};
  for (let dep of Array.from(filter_dependencies(esprima.parse(raw)))) {
    aliased[dep] = resolve(filepath, dep);
  }
  return aliased;
}

export function dependents(file, filepath, raw) {
  let files = [];
  for (let dirpath of Array.from(config.input)) {
    for (filepath of Array.from(fsu.find(dirpath, file.compiler.ext))) {
      if (filepath === file.filepath) {
        continue;
      }
      files.push({
        filepath,
        raw: fs.readFileSync(filepath).toString()
      });
    }
  }

  return file.compiler.resolve_dependents(file.filepath, files);
}

var filter_dependencies = function(node, found) {
  let item;
  if (found == null) {
    found = [];
  }
  if (node instanceof Array) {
    for (item of Array.from(node)) {
      filter_dependencies(item, found);
    }
  } else if (node instanceof Object) {
    for (let key in node) {
      item = node[key];
      filter_dependencies(item, found);
    }
  }

  if (node instanceof Object) {
    let is_exp = (node != null ? node.type : undefined) === 'CallExpression';
    let is_idf =
      __guard__(node != null ? node.callee : undefined, x => x.type) ===
      'Identifier';
    let is_req =
      __guard__(node != null ? node.callee : undefined, x1 => x1.name) ===
      'require';
    let is_lit =
      __guard__(
        __guard__(node != null ? node.arguments : undefined, x3 => x3[0]),
        x2 => x2.type
      ) === 'Literal';

    if (is_exp && is_idf && is_req && is_lit) {
      found.push(node.arguments[0].value);
    }
  }

  return found;
};
function __guard__(value, transform) {
  return typeof value !== 'undefined' && value !== null
    ? transform(value)
    : undefined;
}
