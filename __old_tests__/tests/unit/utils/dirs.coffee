path = require 'path'
should = require('chai').should()

base = path.join __dirname, '..', '..', '..', 'fixtures', 'basic'
app = path.join base, 'src', 'app.coffee'
rel = path.relative base, app

describe '[unit][utils] dirs', ->

  before -> global.__nocolor = true
  after -> global.__nocolor = null && delete global.__nocolor

  it 'getting pwd', ->
    global.cli_options = base: base
    dirs = require '../../../../lib/utils/dirs'
    dirs.pwd.should.equal base

  it 'getting root', ->
    global.cli_options = base: base
    dirs = require '../../../../lib/utils/dirs'
    dirs.root.should.equal path.join __dirname, '..', '..', '..', '..'

  it 'getting pwd after --base inject', ->
    global.cli_options = base: base

    dirs = require '../../../../lib/utils/dirs'
    dirs.pwd.should.equal base

    global.cli_options = null
    delete global.cli_options

  it 'getting pwd for inexistent base path', (done)->
    out = 0
    err_msg = 'error Dir informed with [--base] option doesn\'t exist ~> '
    err_msg += 'non/existent/folder'

    global.cli_options = base: 'non/existent/folder'

    global.__stdout = (data)-> out++
    global.__stderr = (data)->
      out.should.equal 0
      data.should.equal err_msg
      done()
    
    require '../../../../lib/utils/dirs'
    global.cli_options = null
    delete global.cli_options

  it 'getting relative path', ->
    global.cli_options = base: base

    dirs = require '../../../../lib/utils/dirs'
    dirs.relative(app).should.equal rel

    global.cli_options = null
    delete global.cli_options