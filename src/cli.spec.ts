import test = require('tape');
import cli = require('./cli');

test('argv', function (t) {
  t.plan(1);
  return t.equal(typeof cli.argv, 'object', 'Options Array');
});
