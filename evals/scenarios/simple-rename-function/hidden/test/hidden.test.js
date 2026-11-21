import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotal } from '../src/cart.js';
import { orderTotal } from '../src/order.js';
import { line } from '../src/report.js';

test('renamed and still wired', () => {
  assert.equal(calculateTotal([{ price: 5, qty: 2 }]), 10);
  assert.equal(orderTotal({ items: [{ price: 5, qty: 2 }], shipping: 1 }), 11);
  assert.equal(line([{ price: 1, qty: 1 }]), 'Total: 1');
});
