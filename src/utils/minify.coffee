CleanCSS = require 'clean-css'
uglify = require 'uglify-js'

exports.js = ( uncompressed )->
  result = uglify.minify uncompressed
  # TODO:
  # Uglify does not throw an error
  # this needs to be handled somehow
  # if result.error then ...
  result.code

exports.css = ( uncompressed )->
  new CleanCSS().minify uncompressed
