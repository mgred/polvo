test = require 'tape'
cli = require './src/cli'

test 'argv', (t)->
  t.plan 1
  t.equal (typeof cli.argv), 'object', 'Options Array'
