test = require 'tape'
sinon = require 'sinon'
proxyquire = require 'proxyquire'

relative = sinon.spy()
join = sinon.spy()
resolve = sinon.spy (x)-> x
existsSync = sinon.stub()
error = sinon.spy()
logger = -> {error}
mockDependencies = (argv, baseExists = false)->
  resolve.resetHistory()
  deps =
    './logger': logger
    '../cli': {argv}
    path: { relative, resolve, join }
    fs: { existsSync: (existsSync.returns baseExists) }

test 'root', (t)->
  dirs = proxyquire './dirs', (mockDependencies {}, true)
  t.plan 1
  t.ok join.calledOnceWithExactly __dirname, '..', '..'

test 'pwd, when argv.base is given and exists', (t)->
  base = 'test'
  dirs = proxyquire './dirs', (mockDependencies {base}, true)
  t.plan 2
  t.ok (resolve.calledOnceWithExactly base), 'path.resolve was called'
  t.equals dirs.pwd, base, 'pwd === base'

test 'pwd, when argv.base is given and does not exist', (t)->
  base = 'test'
  dirs = proxyquire './dirs', (mockDependencies {base})
  t.plan 2
  t.ok error.calledOnce, 'error was called'
  t.equals dirs.pwd, null, 'dirs.pwd === null'

test 'pwd, when argv.base is not given', (t)->
  dirs = proxyquire './dirs', (mockDependencies {})
  t.plan 1
  t.equals dirs.pwd, '.', 'pwd === \'.\''

test 'relative', (t)->
  dirs = proxyquire './dirs', (mockDependencies {})
  dirs.relative 'test'
  t.plan 1
  t.ok (relative.calledOnceWithExactly '.', 'test' ), 'path.relative was called'
