CleanCSS = require 'clean-css'
uglify = require 'uglify-js'

exports.js = ( uncompressed )->
  # TODO: Ugify does not handle any errors. They appear
  # in `result.error` and need to be handles manually.
  result = uglify.minify uncompressed
  result.code

exports.css = ( uncompressed )->
  new CleanCSS().minify uncompressed
