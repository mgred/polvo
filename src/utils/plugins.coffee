# _ = require 'lodash' # unused

fs = require 'fs'
path = require 'path'
# util = require 'util' # unused

dirs = require '../utils/dirs'
{error, info} = require('../utils/logger')('utils/plugins')

plugins = []
registered = {}

get_plugin_manifest = ( folder, plugin )->
  manifest = path.join folder, 'node_modules', plugin, 'package.json'
  return manifest if fs.existsSync manifest
  null

  # Don't know why this is here
  # return null if folder is path.join folder, '..'
  # get_plugin_manifest path.join(folder, '..'), plugin

scan = (folder)->
  manifest_path = path.join folder, 'package.json'
  manifest = require manifest_path

  for plugin of manifest.dependencies
    pmanifest_path = get_plugin_manifest folder, plugin

    if pmanifest_path is null
      info "dependency '#{plugin}' not installed, can\'t check if its a plugin"
      continue

    pmanifest = require pmanifest_path

    if pmanifest.polvo and not registered[pmanifest.name]
      registered[pmanifest.name] = true
      plugins.push require plugin

#scan path.join dirs.root

app_json = path.join dirs.pwd, 'package.json'
if fs.existsSync app_json
  #scan dirs.pwd
else
  info 'app doesn\'t have a `package.json` file, loading built-in plugins only'

module.exports = plugins
# Export for testability
module.exports.get_plugin_manifest = get_plugin_manifest
module.exports.scan = scan
