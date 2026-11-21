import test from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../src/db.mjs';
import { createInvoiceService } from '../src/invoices.mjs';
test('a tenant cannot read or pay another tenant invoice', () => {
  const db = createDb();
  const svc = createInvoiceService(db);
  const a = svc.create({ tenantId: 'A' }, { customer: 'x', amount: 1 });
  assert.equal(svc.getInvoice({ tenantId: 'B' }, a.id), null);
  assert.equal(svc.markPaid({ tenantId: 'B' }, a.id), null);
  assert.equal(db.findById(a.id).status, 'open');
});
