import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotal } from '../src/cart.js';

test('totals', () => assert.equal(calculateTotal([{ price: 2, qty: 3 }]), 6));
