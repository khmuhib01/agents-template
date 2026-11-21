import test from 'node:test';
import assert from 'node:assert/strict';
import { calcTotal } from '../src/cart.js';

test('totals', () => assert.equal(calcTotal([{ price: 2, qty: 3 }]), 6));
