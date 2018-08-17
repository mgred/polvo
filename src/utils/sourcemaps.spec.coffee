test = require 'tape'
sinon = require 'sinon'
proxyquire = (require 'proxyquire').noCallThru()

basename = sinon.spy()
relative = sinon.spy()
path = {basename}
dirs = {relative}
config =
  output:
    js: 'test'

deps = {
  './config': config
  './dirs': dirs
  path
}

sourcemaps = proxyquire './sourcemaps', deps

test 'assemble, if no files are given', (t)->
  sourcemaps.assemble []
  t.plan 1
  t.ok basename.calledOnceWithExactly 'test'
