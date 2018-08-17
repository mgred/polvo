test = require 'tape'
sinon = require 'sinon'
proxyquire = require 'proxyquire'

existsSync = sinon.stub().returns true
join = sinon.stub().returns '../../package.json'
deps =
  path: {join}
  fs: {existsSync}
  '../../package.json': {}

plugins = proxyquire './plugins', deps

test 'get_plugin_manifest, when the manifest exists', (t)->
  manifest = plugins.get_plugin_manifest 'x', 'x'
  t.plan 1
  t.ok join.calledWithExactly 'x', 'node_modules', 'x', 'package.json'
