import { createDb } from './src/db.mjs';
import { createInvoiceService } from './src/invoices.mjs';
const fail = (m) => { console.error(m); process.exit(1); };
const mode = process.argv[2];
const setup = () => {
  const db = createDb(); const svc = createInvoiceService(db);
  const a = svc.create({ tenantId: 'A', userId: 'u1' }, { customer: 'Acme', amount: 10 });
  const b = svc.create({ tenantId: 'B', userId: 'u2' }, { customer: 'Bravo', amount: 20 });
  return { db, svc, a, b };
};
const A = { tenantId: 'A', userId: 'u1' };
if (mode === 'own-works') {
  const { svc, a } = setup();
  const got = svc.getInvoice(A, a.id); if (!got || got.id !== a.id) fail('own invoice not returned');
  const paid = svc.markPaid(A, a.id); if (!paid || paid.status !== 'paid') fail('markPaid did not mark own invoice paid');
  const csv = svc.exportCsv(A); if (!/id,customer,amount,status/.test(csv) || !csv.includes('Acme')) fail('csv missing own data');
} else if (mode === 'no-cross-read') {
  const { svc, b } = setup();
  let got; try { got = svc.getInvoice(A, b.id); } catch { got = null; }
  if (got) fail('tenant A read tenant B invoice ' + JSON.stringify(got));
} else if (mode === 'no-cross-write') {
  const { svc, db, b } = setup();
  try { svc.markPaid(A, b.id); } catch {}
  if (db.findById(b.id).status !== 'open') fail('tenant A changed tenant B invoice');
} else if (mode === 'csv-scoped') {
  const { svc } = setup(); const csv = svc.exportCsv(A);
  if (csv.includes('Bravo')) fail('csv export leaks another tenant');
} else if (mode === 'list-unchanged') {
  const { svc } = setup(); const l = svc.list(A); if (l.length !== 1 || l[0].customer !== 'Acme') fail('list regressed');
} else fail('unknown mode');
