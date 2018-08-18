let Files;
import path = require('path');
import fs = require('fs');
import fsu = require('fs-util');
import _ = require('lodash');
import dirs = require('../utils/dirs');
import config = require('../utils/config');
import compiler = require('./compiler');

import { argv } from '../cli';
import plugins = require('../utils/plugins');

let logger = require('../utils/logger')('core/files');
import components = require('../extras/component');

let { error, warn, info, debug } = logger;

let log_created = logger.file.created;
let log_changed = logger.file.changed;
let log_deleted = logger.file.deleted;

import File = require('./file');

export default new (Files = function () {
  let exts = undefined;
  Files = class Files {
    prototype;
    files;
    watchers;

    static initClass() {

      exts = Array.from(plugins).map(plugin => plugin.ext);

      this.prototype.files = null;
      this.prototype.watchers = null;
    }

    constructor() {
      this.bulk_create_file = this.bulk_create_file.bind(this);
      this.refresh_dependents = this.refresh_dependents.bind(this);
      this.onfschange = this.onfschange.bind(this);
      this.watchers = [];
      this.collect();
    }

    collect() {
      let filepath;
      this.files = [];

      // collecting files from disk
      for (let dirpath of Array.from(config.input)) {
        for (filepath of Array.from(fsu.find(dirpath, exts))) {
          this.create_file(filepath);
        }
      }

      // collecting component files
      for (filepath of Array.from(components)) {
        this.create_file(filepath);
      }

      if (argv.watch) {
        return this.watch_inputs();
      }
    }

    create_file(filepath) {
      // relative paths means file was not found on disk!
      let file;
      if (filepath !== path.resolve(filepath)) {
        // TODO: should possibly computates the probably path to file and watch
        // it for changes, so when the file get there it get properly assembled
        return;
      }

      if (file = _.find(this.files, { filepath })) {
        return file;
      }

      this.files.push(file = new File(filepath));
      file.on('new:dependencies', this.bulk_create_file);
      file.on('refresh:dependents', this.refresh_dependents);
      file.init();

      if (argv.watch && !this.is_under_inputs(filepath)) {
        this.watch_file(file.filepath);
      }

      return file;
    }

    extract_file(filepath) {
      let index = _.findIndex(this.files, f => f.filepath === filepath);
      return this.files.splice(index, 1)[0];
    }

    is_under_inputs(filepath, consider_aliases) {
      let alias;
      let input = true;
      for (var dirpath of Array.from(config.input)) {
        if (input) {
          input = filepath.indexOf(dirpath) === 0;
        }
      }

      if (consider_aliases) {
        alias = true;
        for (let map in config.alias) {
          dirpath = config.alias[map];
          dirpath = path.join(dirs.pwd, dirpath);
          if (alias) {
            alias = filepath.indexOf(dirpath) === 0;
          }
        }
      }

      return input || alias;
    }

    bulk_create_file(deps) {
      return Array.from(deps).map(dep => this.create_file(dep));
    }

    refresh_dependents(dependents) {
      return (() => {
        let result = [];
        for (let dependent of Array.from(dependents)) {
          let file = _.find(this.files, { filepath: dependent.filepath });
          if (file != null) {
            result.push(file.refresh());
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    }

    watch_file(filepath) {
      let dir = path.dirname(filepath);
      let watched = _.find(this.watchers, { root: dir });

      if (watched == null) {
        let watcher;
        this.watchers.push(watcher = fsu.watch(dir));
        watcher.on('create', file => this.onfschange('create', file));
        watcher.on('change', file => this.onfschange('change', file));
        return watcher.on('delete', file => this.onfschange('delete', file));
      }
    }

    watch_inputs() {
      for (let dirpath of Array.from(config.input)) {
        let watched = _.find(this.watchers, { root: dirpath });

        if (watched == null) {
          var watcher;
          this.watchers.push(watcher = fsu.watch(dirpath, exts));
          watcher.on('create', file => this.onfschange('create', file));
          watcher.on('change', file => this.onfschange('change', file));
          watcher.on('delete', file => this.onfschange('delete', file));
        }
      }
      return null;
    }

    close_watchers() {
      return Array.from(this.watchers).map(watcher => watcher.close());
    }

    onfschange(action, file) {
      let dname, dpath, f;
      let { location, type } = file;

      if (type === "dir" && action === "create") {
        return;
      }
      if (type === "dir" && action === "delete") {
        return;
      }

      switch (action) {

        case "create":
          file = this.create_file(location);
          log_created(location);
          return this.compile(file);

        case "delete":

          log_deleted(location);
          file = this.extract_file(location);

          // check if file's dependencies are used by other files or if them is
          // under a source or mapped folder
          for (let depname in file.dependencies) {

            // if it is under input folders, skip and continue
            let depath = file.dependencies[depname];
            if (this.is_under_inputs(depath, true)) {
              continue;
            }

            // otherwise check other files tha may be using it
            let found = 0;
            for (f of Array.from(this.files)) {
              for (dname in f.dependencies) {
                dpath = f.dependencies[dname];
                if (dpath === depath) {
                  found++;
                }
              }
            }

            // if none is found, remove file from build
            if (!found) {
              this.extract_file(depath);
            }
          }

          // them refresh dependencies and dependents

          // partial may have dependents
          if (file.is_partial) {
            for (let dep of Array.from(file.dependents)) {
              _.find(this.files, { filepath: dep.filepath }).refresh();
            }

            // non-partials may be a dependency for another files
          } else {
            for (f of Array.from(this.files)) {
              for (dname in f.dependencies) {
                dpath = f.dependencies[dname];
                if (dpath === file.filepath) {
                  f.refresh();
                }
              }
            }
          }

          // restart compilation process
          return this.compile(file);

        case "change":
          file = _.find(this.files, { filepath: location });
          log_changed(location);

          // THIS PROBLEM HAS BEEN RESOLVED (APPARENTLY) - will be kept here for
          // a little more to confirm.
          // 
          // if file is null
          //   msg = "Change file is apparently null, it shouldn't happened.\n"
          //   msg += "Please report this at the repo issues section."
          //   warn msg
          // else
          //   log_changed location

          file.refresh();
          return this.compile(file);
      }
    }

    compile(file) {
      switch (file.output) {
        case 'js':
          return compiler.build_js(true);
        case 'css':
          return compiler.build_css(true);
      }
    }
  };
  Files.initClass();
  return Files;
}())();
