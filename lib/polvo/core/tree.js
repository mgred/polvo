// Generated by CoffeeScript 1.6.2
(function() {
  var ArrayUtil, File, FnUtil, StringUtil, Tree, debug, error, fs, fsu, log, path, util, warn, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  path = require('path');

  fs = require('fs');

  util = require('util');

  fsu = require('fs-util');

  FnUtil = require('../utils/fn-util');

  StringUtil = require('../utils/string-util');

  ArrayUtil = require('../utils/array-util');

  File = require('./file');

  _ref = require('../utils/log-util'), log = _ref.log, debug = _ref.debug, warn = _ref.warn, error = _ref.error;

  module.exports = Tree = (function() {
    var watchers;

    Tree.prototype.files = [];

    watchers = null;

    Tree.prototype.optimizer = null;

    function Tree(polvo, cli, config, tentacle) {
      this.polvo = polvo;
      this.cli = cli;
      this.config = config;
      this.tentacle = tentacle;
      this._on_fs_change = __bind(this._on_fs_change, this);
      this.init();
    }

    Tree.prototype.init = function() {
      var filepath, src, _i, _len, _ref1, _results;

      this.files = [];
      _ref1 = this.config.sources;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        src = _ref1[_i];
        _results.push((function() {
          var _j, _len1, _ref2, _results1;

          _ref2 = fsu.find(src, File.EXTENSIONS);
          _results1 = [];
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            filepath = _ref2[_j];
            _results1.push(this.files.push(new File(this.polvo, this.cli, this.config, this.tentacle, this, src, filepath)));
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    Tree.prototype.optimize = function() {
      return this.optimizer.optimize();
    };

    Tree.prototype.compile_files_to_disk = function() {
      var file, _i, _len, _ref1, _results;

      _ref1 = this.files;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        file = _ref1[_i];
        _results.push(file.compile_to_disk());
      }
      return _results;
    };

    Tree.prototype.watch = function() {
      var src, vname, vpath, watcher, _i, _len, _ref1, _ref2, _results;

      this.watchers = [];
      _ref1 = this.config.sources;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        src = _ref1[_i];
        this.watchers.push((watcher = fsu.watch(src, File.EXTENSIONS)));
        watcher.on('create', FnUtil.proxy(this._on_fs_change, false, src, 'create'));
        watcher.on('change', FnUtil.proxy(this._on_fs_change, false, src, 'change'));
        watcher.on('delete', FnUtil.proxy(this._on_fs_change, false, src, 'delete'));
      }
      _ref2 = this.config.vendors.javascript;
      _results = [];
      for (vname in _ref2) {
        vpath = _ref2[vname];
        if (vname === 'incompatible') {
          continue;
        }
        this.watchers.push((watcher = fsu.watch(vpath)));
        src = path.join(path.dirname(vpath), '..');
        watcher.on('create', FnUtil.proxy(this._on_fs_change, true, src, 'create'));
        watcher.on('change', FnUtil.proxy(this._on_fs_change, true, src, 'change'));
        _results.push(watcher.on('delete', FnUtil.proxy(this._on_fs_change, true, src, 'delete')));
      }
      return _results;
    };

    Tree.prototype.close_watchers = function() {
      var watcher, _i, _len, _ref1, _results;

      _ref1 = this.watchers;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        watcher = _ref1[_i];
        _results.push(watcher.close());
      }
      return _results;
    };

    Tree.prototype._on_fs_change = function(is_vendor, dir, ev, f) {
      var file, include, item, location, msg, now, relative_path, type, _i, _len, _ref1;

      if (f.type === "dir" && ev === "create") {
        return;
      }
      location = f.location, type = f.type;
      include = true;
      _ref1 = this.config.exclude;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        item = _ref1[_i];
        include &= !(new RegExp(item).test(location));
      }
      if (!include) {
        return;
      }
      type = StringUtil.titleize(f.type);
      relative_path = location.replace(dir, '');
      if (relative_path[0] === path.sep) {
        relative_path = relative_path.substr(1);
      }
      now = (("" + (new Date)).match(/[0-9]{2}\:[0-9]{2}\:[0-9]{2}/))[0];
      switch (ev) {
        case "create":
          msg = ("+ " + type + " created").bold;
          log(("[" + now + "] " + msg + " " + relative_path).cyan);
          file = new File(this.polvo, this.cli, this.config, this.tentacle, this, dir, location);
          this.files.push(file);
          return file.compile_to_disk();
        case "delete":
          file = ArrayUtil.find(this.files, {
            relative_path: relative_path
          });
          if (file === null) {
            return;
          }
          file.item.delete_from_disk();
          this.files.splice(file.index, 1);
          msg = ("- " + type + " deleted").bold;
          return log(("[" + now + "] " + msg + " " + relative_path).red);
        case "change":
          file = ArrayUtil.find(this.files, {
            relative_path: relative_path
          });
          if (file === null && is_vendor === false) {
            return warn("Change file is apparently null, it shouldn't happened.\n" + "Please report this at the repo issues section.");
          } else {
            msg = ("• " + type + " changed").bold;
            log(("[" + now + "] " + msg + " " + relative_path).cyan);
            if (is_vendor) {
              return this.tentacle.optimizer.copy_vendors_to_release(false, location);
            } else {
              file.item.refresh();
              return file.item.compile_to_disk(true);
            }
          }
      }
    };

    return Tree;

  })();

}).call(this);

/*
//@ sourceMappingURL=tree.map
*/