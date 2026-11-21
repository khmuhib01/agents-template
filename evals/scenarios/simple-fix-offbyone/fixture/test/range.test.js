import test from 'node:test';
import assert from 'node:assert/strict';
import { sumRange } from '../src/range.js';

test('inclusive range', () => assert.equal(sumRange(1, 3), 6));
