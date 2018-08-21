import * as test from 'tape';
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';

let relative = sinon.spy();
let join = sinon.spy();
let resolve = sinon.spy((x: any) => x);
let existsSync = sinon.stub();
let error = sinon.spy();
let logger = () => ({ error });
let mockDependencies = function(argv: any, baseExists = false) {
  let deps;
  resolve.resetHistory();
  return (deps = {
    './logger': logger,
    '../cli': { argv },
    path: { relative, resolve, join },
    fs: { existsSync: existsSync.returns(baseExists) }
  });
};

test('root', function(t) {
  let dirs = proxyquire.noCallThru()('./dirs', mockDependencies({}, true));
  t.plan(1);
  return t.ok(join.calledOnceWithExactly(__dirname, '..', '..'));
});

test('pwd, when argv.base is given and exists', function(t) {
  let base = 'test';
  let dirs = proxyquire('./dirs', mockDependencies({ base }, true));
  t.plan(2);
  t.ok(resolve.calledOnceWithExactly(base), 'path.resolve was called');
  return t.equals(dirs.pwd, base, 'pwd === base');
});

test('pwd, when argv.base is given and does not exist', function(t) {
  let base = 'test';
  let dirs = proxyquire('./dirs', mockDependencies({ base }));
  t.plan(2);
  t.ok(error.calledOnce, 'error was called');
  return t.equals(dirs.pwd, null, 'dirs.pwd === null');
});

test('pwd, when argv.base is not given', function(t) {
  let dirs = proxyquire('./dirs', mockDependencies({}));
  t.plan(1);
  return t.equals(dirs.pwd, '.', "pwd === '.'");
});

test('relative', function(t) {
  let dirs = proxyquire('./dirs', mockDependencies({}));
  dirs.relative('test');
  t.plan(1);
  return t.ok(
    relative.calledOnceWithExactly('.', 'test'),
    'path.relative was called'
  );
});
