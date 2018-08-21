import test = require('tape');
import sinon = require('sinon');

let proxyquire = require('proxyquire')
  .noCallThru()
  .noPreserveCache();
let mockDependencies = function(deps, s) {
  if (s == null) {
    s = require('sinon');
  }
  let a = {};
  for (let k in deps) {
    let v = deps[k];
    a[k] = s.spy(v);
  }
  return a;
};

let depMocks = {
  build() {},
  log() {},
  server() {},
  release(x) {
    return x();
  }
};

let { build, log, release, server } = mockDependencies(depMocks);

let options = [
  { compile: true },
  { watch: true },
  { release: true },
  { compile: true, server: true },
  { watch: true, server: true },
  { release: true, server: true }
];

test('dummy', function(t) {
  t.plan(1);
  return t.ok(true);
});

test('help', function(t) {
  ({ log } = mockDependencies({ log() {} }));
  let help = sinon.stub().returns('test');
  let deps = {
    './cli': { argv: {}, help },
    './utils/logger'() {
      return { log };
    }
  };

  let polvo = proxyquire('./polvo', deps);
  t.plan(2);
  polvo();
  t.ok(help.calledOnce);
  return t.ok(log.calledOnceWith('test'));
});

test('version', function(t) {
  ({ log } = mockDependencies(depMocks));
  let deps = {
    './cli': { argv: { version: true } },
    './utils/logger'() {
      return { log };
    },
    './utils/version': 'test'
  };

  let polvo = proxyquire('./polvo', deps);
  t.plan(1);
  polvo();
  return t.ok(log.calledOnceWith('test'));
});

let testCliArgs = o =>
  function(t) {
    //sandbox = sinon.createSandbox()
    ({ build, release, server } = mockDependencies(depMocks));
    let deps = {
      './cli': { argv: o },
      './utils/config': {},
      './core/compiler': { build, release },
      './core/server': server
    };

    let polvo = proxyquire('./polvo', deps);

    t.plan(Object.keys(o).length);

    polvo();

    if (o.compile || o.watch) {
      t.ok(build.calledOnce, 'compiler.build()');
      if (o.server) {
        return t.ok(server.calledImmediatelyAfter(build), 'server()');
      }
    } else if (o.release) {
      t.ok(release, 'release()');
      if (o.server) {
        return t.ok(server.calledImmediatelyAfter(release), 'server()');
      }
    }
  };
//sandbox.restore()

for (let o of Array.from(options)) {
  test('polvo', testCliArgs(o));
}
