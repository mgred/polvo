test = require 'tape'
sinon = require 'sinon'
proxyquire = require 'proxyquire'

minify = sinon.stub()
minify.withArgs 'js'
  .returns {code: 'test'}
minify.withArgs 'css'
  .returns 'test'
cleancss = sinon.stub().returns {minify}
uglify = {minify}

get_module = ->
  minify.resetHistory()
  proxyquire './minify', {'clean-css': cleancss, 'uglify-js': uglify}

test 'js', (t)->
  min = get_module()
  result = min.js 'js'
  t.plan 2
  t.ok minify.calledOnce, 'minify was called'
  t.equals result, 'test', 'the result matches'

test 'css', (t)->
  min = get_module()
  result = min.css 'css'
  t.plan 3
  t.ok cleancss.calledWithNew(), 'CleanCss was invoked'
  t.ok minify.calledOnce,'minify was called'
  t.equals result, 'test', 'the result matches'
