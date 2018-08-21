import test = require('tape');
import sinon = require('sinon');

let proxyquire = require('proxyquire').noCallThru();

let basename = sinon.spy();
let relative = sinon.spy();
let path = { basename };
let dirs = { relative };
let config = {
  output: {
    js: 'test'
  }
};

let deps = {
  './config': config,
  './dirs': dirs,
  path
};

let sourcemaps = proxyquire('./sourcemaps', deps);

test('assemble, if no files are given', function(t) {
  sourcemaps.assemble([]);
  t.plan(1);
  return t.ok(basename.calledOnceWithExactly('test'));
});
