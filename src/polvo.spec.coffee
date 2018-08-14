test = require 'tape'
polvo = require './src/polvo'

test 'polvo', (t)->
  t.plan 1
  t.equal (typeof polvo), 'function'
