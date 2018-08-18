import CleanCSS = require('clean-css');
import uglify = require('uglify-js');

export function js(uncompressed) {
  // TODO: Ugify does not handle any errors. They appear
  // in `result.error` and need to be handles manually.
  let result = uglify.minify(uncompressed);
  return result.code;
}

export function css(uncompressed) {
  return new CleanCSS().minify(uncompressed);
}
