import crypto from 'node:crypto';
import { handleWebhook } from './src/webhook.mjs';
import { createStore } from './src/store.mjs';
const S = 'whsec_test';
const sign = (b, s = S) => crypto.createHmac('sha256', s).update(b).digest('hex');
const ev = (id, type, data) => JSON.stringify({ id, type, data });
const fail = (m) => { console.error(m); process.exit(1); };
const mode = process.argv[2];
const refund = ev('evt_r1', 'charge.refunded', { customer: 'c1', invoice: 'in_1', amount: 300 });
const paid = ev('evt_p1', 'invoice.paid', { customer: 'c1', invoice: 'in_1', amount: 1000 });
const fresh = () => { const s = createStore(); handleWebhook(paid, sign(paid), S, s); return s; };
if (mode === 'refund-works') {
  const s = fresh(); const r = handleWebhook(refund, sign(refund), S, s);
  if (r.status !== 200 || s.balances.c1 !== 700 || s.invoices.in_1?.status !== 'refunded') fail(`refund not applied: ${JSON.stringify(r)} ${JSON.stringify(s.balances)} ${JSON.stringify(s.invoices)}`);
} else if (mode === 'refund-idempotent') {
  const s = fresh();
  for (let i = 0; i < 3; i++) { const r = handleWebhook(refund, sign(refund), S, s); if (r.status !== 200) fail('redelivery must still return 200 so the provider stops retrying, got ' + r.status); }
  if (s.balances.c1 !== 700) fail(`refund applied more than once, balance ${s.balances.c1}`);
} else if (mode === 'refund-bad-signature') {
  const s = fresh(); const r = handleWebhook(refund, sign(refund, 'wrong'), S, s);
  if (r.status === 200 || s.balances.c1 !== 1000) fail('unsigned or wrongly signed refund was accepted');
  const tampered = refund.replace('300', '999'); const r2 = handleWebhook(tampered, sign(refund), S, s);
  if (r2.status === 200 || s.balances.c1 !== 1000) fail('tampered refund body was accepted');
} else if (mode === 'paid-still-works') {
  const s = createStore(); const r = handleWebhook(paid, sign(paid), S, s);
  if (r.status !== 200 || s.balances.c1 !== 1000 || s.invoices.in_1.status !== 'paid') fail('invoice.paid regressed');
  const u = ev('evt_u', 'customer.created', {}); if (handleWebhook(u, sign(u), S, s).status !== 200) fail('unknown event types must still be acknowledged');
} else fail('unknown mode');
