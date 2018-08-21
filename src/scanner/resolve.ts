import path = require('path');
import fs = require('fs');
import config = require('../utils/config');
import dirs = require('../utils/dirs');
import plugins = require('../utils/plugins');

let logger = require('../utils/logger')('scanner/resolve');

let { error, warn, info, debug, log } = logger;

let exts = [];
for (let plugin of Array.from(plugins)) {
  if (plugin.output === 'js') {
    exts = exts.concat(plugin.exts);
  }
}

let mod_kinds = 'node_modules components bower_components'.split(' ');
let mod_manifests = 'package.json component.json bower.json'.split(' ');

// resolve the given id relatively to the current filepath
// ------------------------------------------------------------------------------
export default function(filepath, id) {
  // removes js extension to normalize id
  let file;
  id = id.replace(/\.js$/m, '');

  // try to resolve its real path
  for (let index = 0; index < mod_kinds.length; index++) {
    let kind = mod_kinds[index];
    let manifest = mod_manifests[index];
    file = resolve_id(kind, manifest, filepath, id);
    if (file != null) {
      break;
    }
  }

  // return normalized path if file is found
  if (file != null) {
    return path.resolve(file);
  }

  // otherwise show error
  let caller = path.relative(dirs.pwd, filepath);
  error(`Module '${id}' not found for '${caller}'`);
  return id;
}

// Resolves the required id/path
// ------------------------------------------------------------------------------
var resolve_id = function(kind, manifest, filepath, id) {
  // for globals, always go on for module
  let file;
  if (id[0] !== '.') {
    return resolve_module(kind, manifest, filepath, id);
  }

  // breaks id path nodes (if there's some)
  let segs = [].concat(id.split('/'));

  // filter dirname from filepath, to start the search
  let idpath = path.dirname(filepath);

  // loop them mounting the full path relatively to current
  while (segs.length) {
    let seg = segs.shift();
    idpath = path.resolve(idpath, seg);
  }

  // file.js
  if ((file = resolve_file(idpath))) {
    return file;
  }

  // module
  if ((file = resolve_module(kind, manifest, idpath))) {
    return file;
  }

  // mod not found
  return null;
};

// tries to get the file by its name
// ------------------------------------------------------------------------------
var resolve_file = function(filepath) {
  for (let ext of Array.from(exts)) {
    let tmp = filepath;
    tmp = tmp.replace(ext, '');
    tmp += ext;
    if (fs.existsSync(tmp) && !fs.lstatSync(tmp).isDirectory()) {
      return tmp;
    }
  }
  return null;
};

// tries to get the index file inside a directory
// ------------------------------------------------------------------------------
let resolve_index = function(dirpath) {
  // if dirpath?
  let filepath = path.join(dirpath, 'index');
  for (let ext of Array.from(exts)) {
    let tmp = filepath;
    tmp += ext;
    if (fs.existsSync(tmp)) {
      return tmp;
    }
  }
  return null;
};

// ------------------------------------------------------------------------------
var resolve_module = function(kind, manifest, filepath, id) {
  let file, nmods, non_recurse;
  if (id == null) {
    id = '';
  }
  if (id === '') {
    non_recurse = true;
  }

  if (config.alias != null) {
    for (let map in config.alias) {
      let location = config.alias[map];
      if (id.indexOf(map) === 0) {
        nmods = path.join(dirs.pwd, location);
        if (~id.indexOf('/')) {
          id = id.match(/\/(.+)/)[0];
        } else {
          id = '';
        }

        break;
      }
    }
  }

  if (nmods == null) {
    if (id === '') {
      nmods = filepath;
    } else {
      nmods = closest_mod_folder(kind, filepath);
    }
  }

  // if no node_modules is found, return null
  if (nmods == null) {
    return null;
  }

  // trying to reach the `main` entry in manifest (if there's one)
  let mod = path.join(nmods, id);
  let json = path.join(mod, manifest);
  if (json && fs.existsSync(json)) {
    // tries to get the main entry in manifest
    let { main } = require(json);
    if (main != null) {
      // trying to get it as is
      main = path.join(path.dirname(json), main);
      if ((file = resolve_file(main)) != null) {
        return file;
      }

      // or as a folder with an index file inside
      if ((file = resolve_index(main)) != null) {
        return file;
      }
    } else {
      // if there's no main entry, tries to get the index file
      if ((file = resolve_index(mod)) != null) {
        return file;
      }
    }
  }

  // if there's no json, move on with other searches
  let idpath = path.join(nmods, id);

  // tries to get file as is
  if ((file = resolve_file(idpath)) != null) {
    return file;
  }

  // and finally as index
  if ((file = resolve_index(idpath)) != null) {
    return file;
  }

  // keep searching on parent node_module's folders
  if (filepath !== '/' && non_recurse !== true) {
    return resolve_module(kind, manifest, path.join(filepath, '..'), id);
  }
};

// searches for the closest node_modules folder in the parent dirs
// ------------------------------------------------------------------------------
var closest_mod_folder = function(kind, filepath) {
  let tmp;
  if (path.extname(filepath) !== '') {
    if (!fs.lstatSync(filepath).isDirectory()) {
      tmp = path.dirname(filepath);
    }
  }

  if (!tmp) {
    tmp = filepath;
  }

  while (tmp !== '/') {
    let nmods = path.join(tmp, kind);
    if (fs.existsSync(nmods)) {
      return nmods;
    } else {
      tmp = path.join(tmp, '..');
    }
  }

  return null;
};
