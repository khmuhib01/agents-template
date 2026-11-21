import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { handleWebhook } from '../src/webhook.mjs';
import { createStore } from '../src/store.mjs';
const sign = (b, s) => crypto.createHmac('sha256', s).update(b).digest('hex');
test('refund is applied once even if the event is delivered twice', () => {
  const store = createStore();
  store.balances.c1 = 1000;
  const body = JSON.stringify({ id: 'evt_9', type: 'charge.refunded', data: { customer: 'c1', invoice: 'in_1', amount: 300 } });
  handleWebhook(body, sign(body, 's'), 's', store);
  handleWebhook(body, sign(body, 's'), 's', store);
  assert.equal(store.balances.c1, 700);
});
