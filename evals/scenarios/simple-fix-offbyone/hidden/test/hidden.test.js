import test from 'node:test';
import assert from 'node:assert/strict';
import { sumRange } from '../src/range.js';

test('edges', () => {
  assert.equal(sumRange(5, 5), 5);
  assert.equal(sumRange(-2, 2), 0);
  assert.equal(sumRange(0, 0), 0);
});
