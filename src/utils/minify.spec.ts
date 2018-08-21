import * as test from 'tape';
import { stub } from 'sinon';
import * as proxyquire from 'proxyquire';

const minify = stub();
const cleancss = stub().returns({ minify });
const uglify = { minify };
minify.withArgs('js').returns({ code: 'test' });
minify.withArgs('css').returns('test');

const mockModule = function() {
  minify.resetHistory();
  return proxyquire('./minify', { 'clean-css': cleancss, 'uglify-js': uglify });
};

test('js', function(t) {
  const min = mockModule();
  const result = min.js('js');
  t.plan(2);
  t.ok(minify.calledOnce, 'minify was called');
  t.equals(result, 'test', 'the result matches');
});

test('css', function(t) {
  const min = mockModule();
  const result = min.css('css');
  t.plan(3);
  t.ok(cleancss.calledWithNew(), 'CleanCss was invoked');
  t.ok(minify.calledOnce, 'minify was called');
  t.equals(result, 'test', 'the result matches');
});
