_ = require 'lodash'
fs = require 'fs'
zlib = require 'zlib'

fsu = require 'fs-util'
path = require 'path'
filesize = require 'filesize'

files = require './files'
server = require './server'

{argv} = require '../cli'
dirs = require '../utils/dirs'
config = require '../utils/config'
minify = require '../utils/minify'
sourcemaps = require '../utils/sourcemaps'
logger = require('../utils/logger')('core/compiler')


{error, warn, info, debug} = logger
log_compiled = logger.file.compiled


# prefix
prefix = ";(function(){"

# helpers folder path
helpers_path = path.join dirs.root, 'src', 'core', 'helpers'

# cjs loader
loader_path = path.join helpers_path, 'loader.js'
loader = fs.readFileSync loader_path, 'utf-8'
loader = loader.replace '~ALIASES', JSON.stringify config.alias

# split loader
split_loader_path = path.join helpers_path, 'split.loader.js'
split_loader = fs.readFileSync split_loader_path, 'utf-8'

# auto reload
#io_path = path.join dirs.root, 'node_modules', 'socket.io', 'node_modules'
io_path = path.join dirs.root, 'node_modules', 'socket.io-client', 'dist', 'socket.io.js'
reloader_path = loader_path.replace 'loader.js', 'reloader.js'

auto_reload = fs.readFileSync io_path, 'utf-8'
auto_reload += '\n'
auto_reload += fs.readFileSync reloader_path, 'utf-8'

source_maps_header = """
/*
//@ sourceMappingURL=data:application/json;charset=utf-8;base64,~MAP
*/
"""

# sufix
sufix = '})()'


compilers = {}


exports.build = ->
  compilers = {}
  exports.build_js true
  exports.build_css true


exports.release = (done) ->
  jss = exports.build_js()
  exports.build_css()

  pending = 0
  after = -> done?() if --pending is 0

  if config.minify.js

    for js in jss
      pending++

      uncompressed = fs.readFileSync path.join js
      fs.writeFileSync js, minify.js uncompressed.toString()
      exports.notify js, after

  if config.minify.css and fs.existsSync config.output.css
    pending++
    uncompressed = fs.readFileSync config.output.css
    fs.writeFileSync config.output.css, minify.css uncompressed.toString()
    exports.notify config.output.css, after

exports.build_js = (notify) ->

  files.files = _.sortBy files.files, 'filepath'

  all = _.filter files.files, output: 'js'
  
  return unless all.length

  unless config.output.js?
    error 'JS not saved, you need to set the js output in your config file'
    return

  if argv.split
    split_paths = build_js_split all, notify
  else
    split_paths = []

  helpers = {}
  merged = []

  offset = 0

  for each in all
    continue if each.is_partial

    # saving compiled contents and line count
    js = each.wrapped
    linesnum = js.split('\n').length

    # storing compiled code in merged array
    merged.push js

    # updating file's offset info for source maps concatenation
    each.source_map_offset = offset
    offset += linesnum

    # getting compiler
    comp = each.compiler
    comp_name = comp.name
    if not helpers[comp_name]? and (helper = comp.fetch_helpers?())?
      helpers[comp_name] or= helper

  # merging helpers
  helpers = (v for k, v of helpers)
  merged = merged.join '\n'

  # starting empty buffer
  buffer = ''

  if argv.server and not argv.release
    buffer += "\n// POLVO :: AUTORELOAD\n"
    buffer += auto_reload

  buffer += prefix
  buffer += '\n// POLVO :: HELPERS\n'
  buffer += helpers

  buffer += "\n// POLVO :: LOADER\n"
  buffer += loader

  unless argv.split
    buffer += "\n// POLVO :: MERGED FILES\n"

  start = buffer.split('\n').length
  for each in all
    each.source_map_offset += start

  src_maps = sourcemaps.assemble all

  unless argv.split
    buffer += merged

  buffer += "\n// POLVO :: INITIALIZER\n"
  boot = "require('#{config.boot}');"

  if argv.split

    # make a copy array
    relative_paths = split_paths.slice 0

    # fix all paths relatively for the boot-loader
    for p, i in relative_paths
      base_folder = config?.server?.root or path.dirname config.output.js
      relative_paths[i] = p.replace base_folder, ''

    tmp = split_loader.replace '~SRCS', JSON.stringify relative_paths
    tmp = tmp.replace '~BOOT', boot
    buffer += tmp
  else
    buffer += boot

  unless argv.split
    buffer += "\n"
    base64_maps = sourcemaps.encode_base64 src_maps
    buffer += source_maps_header.replace '~MAP', base64_maps
  
  buffer += sufix

  fs.writeFileSync config.output.js, buffer

  if not argv.release
    server.reload 'js'

  if notify
    exports.notify config.output.js

  [config.output.js].concat split_paths

exports.build_css = (notify) ->
  files.files = _.sortBy files.files, 'filepath'

  all = _.filter files.files, output: 'css'
  return unless all.length

  unless config.output.css?
    error 'CSS not saved, you need to set the css output in your config file'
    return

  merged = []
  for each in all
    continue if each.is_partial
    merged.push each.compiled

  merged = merged.join '\n'

  fs.writeFileSync config.output.css, merged
  server.reload 'css'
  exports.notify config.output.css if notify

exports.notify = ( filepath, done )->
  fsize = filesize fs.statSync(filepath).size

  if not argv.release
    log_compiled "#{filepath} (#{fsize})"
    return done?()

  zlib.gzip fs.readFileSync(filepath, 'utf-8'), (err, gzip)->
    fs.writeFileSync filepath + '.tmp.gzip', gzip
    gsize = filesize fs.statSync(filepath + '.tmp.gzip').size
    log_compiled "#{filepath} (#{fsize}) (#{gsize} gzipped)"
    fs.unlinkSync filepath + '.tmp.gzip'
    done?()


get_split_base_dir = (files)->

  buffer = []
  tokens = {}

  for file in files
    for part in file.filepath.split path.sep
      # - commenting line not being touched by tests
      # -- uncomment in case of any problem with --slit mode
      # continue if tokens[part]

      start = buffer.concat(part).join path.sep
      all = true

      for f in files
        all and all = f.filepath.indexOf(start) is 0

      if all
        tokens[part] = buffer.push part
      else
        return buffer.join(path.sep)

build_js_split = (files, notify)->
  base = get_split_base_dir files
  paths = []

  for file in files
    filename = path.basename(file.filepath).replace file.compiler.ext, '.js'
    filefolder = path.dirname file.filepath

    httpath = path.join '__split__', filefolder.replace(base, ''), filename
    output = path.join path.dirname(config.output.js), httpath

    paths.push output
    buffer = file.wrapped

    if file.source_map?
      
      # hard moving offset to 1 (jumping over module registration)
      file.source_map_offset = 1
      map = sourcemaps.assemble [file]
      map64 = sourcemaps.encode_base64 map

      buffer += '\n'
      buffer += source_maps_header.replace '~MAP', map64

    folder = path.dirname output
    unless fs.existsSync folder
      fsu.mkdir_p folder

    fs.writeFileSync output, buffer
    
    if notify
      exports.notify output

  paths
