import test = require('tape');
import sinon = require('sinon');
import proxyquire = require('proxyquire');

let existsSync = sinon.stub().returns(true);
let join = sinon.stub().returns('../../package.json');
let deps = {
  path: { join },
  fs: { existsSync },
  '../../package.json': {}
};

let plugins = proxyquire('./plugins', deps);

test('get_plugin_manifest, when the manifest exists', function(t) {
  let manifest = plugins.get_plugin_manifest('x', 'x');
  t.plan(1);
  return t.ok(join.calledWithExactly('x', 'node_modules', 'x', 'package.json'));
});
