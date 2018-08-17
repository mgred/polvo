test = require 'tape'
sinon = require 'sinon'
proxyquire = (require 'proxyquire').noCallThru().noPreserveCache()
mockDependencies = (deps, s = (require 'sinon'))->
  a = {}
  for k, v of deps
    a[k] = s.spy v
  a

depMocks =
  build: ->
  log: ->
  server: ->
  release: (x)-> x()

{build, log, release, server} = mockDependencies depMocks

options = [
  { compile: true }
  { watch: true }
  { release: true }
  { compile: true, server: true }
  { watch: true, server: true }
  { release: true, server: true }
]

test 'dummy', (t)->
  t.plan 1
  t.ok true

test 'help', (t)->
  {log} = mockDependencies log: ->
  help = sinon.stub().returns 'test'
  deps =
    './cli': { argv: {}, help }
    './utils/logger': -> {log}

  polvo = proxyquire './polvo', deps
  t.plan 2
  polvo()
  t.ok help.calledOnce
  t.ok (log.calledOnceWith 'test')
  

test 'version', (t)->
  {log} = mockDependencies depMocks
  deps =
    './cli': { argv: { version: true } }
    './utils/logger': -> {log}
    './utils/version': 'test'

  polvo = proxyquire './polvo', deps
  t.plan 1
  polvo()
  t.ok (log.calledOnceWith 'test')

testCliArgs = (o)-> (t)->
  #sandbox = sinon.createSandbox()
  {build, release, server} = mockDependencies depMocks
  deps =
    './cli': {argv: o}
    './utils/config': {}
    './core/compiler': { build, release }
    './core/server': server

  polvo = proxyquire './polvo', deps

  t.plan (Object.keys o).length

  polvo()

  if o.compile or o.watch
    t.ok build.calledOnce, 'compiler.build()'
    if o.server
      t.ok (server.calledImmediatelyAfter build), 'server()'
  else if o.release
    t.ok release, 'release()'
    if o.server
      t.ok (server.calledImmediatelyAfter release), 'server()'
  #sandbox.restore()

for o in options
  test 'polvo', (testCliArgs o)
