import fs from 'node:fs';
const fail = (m) => { console.error(m); process.exit(1); };
const mode = process.argv[2];
const files = fs.readdirSync('migrations').filter((f) => /^\d{4}_.*\.sql$/.test(f) && !f.endsWith('.down.sql')).sort();
const fresh = files.filter((f) => Number(f.slice(0, 4)) > 2);
const read = (f) => fs.readFileSync('migrations/' + f, 'utf8');
const strip = (s) => s.replace(/--.*$/gm, '');
if (mode === 'new-migration') { if (!fresh.length) fail('no migration numbered after 0002'); }
else if (mode === 'adds-column') { if (!fresh.some((f) => /ALTER\s+TABLE\s+orders\s+ADD\s+COLUMN\s+status\b/i.test(strip(read(f))))) fail('no ADD COLUMN status on orders'); }
else if (mode === 'column-not-null-default') {
  const sql = fresh.map((f) => strip(read(f))).join('\n');
  const m = sql.match(/ADD\s+COLUMN\s+status\b[^;]*/i);
  if (!m || !/NOT\s+NULL/i.test(m[0]) || !/DEFAULT\s+'pending'/i.test(m[0])) fail('status must be NOT NULL DEFAULT \'pending\' (got: ' + (m && m[0]) + ')');
} else if (mode === 'index-concurrently') {
  const sql = fresh.map((f) => strip(read(f))).join('\n');
  const idx = [...sql.matchAll(/CREATE\s+(UNIQUE\s+)?INDEX\s+(CONCURRENTLY\s+)?[^;]*/gi)];
  if (!idx.length) fail('no index created on (customer_id, status)');
  if (!idx.some((m) => /customer_id\s*,\s*status/i.test(m[0]))) fail('index is not on (customer_id, status)');
  if (idx.some((m) => !m[2])) fail('CREATE INDEX without CONCURRENTLY would block writes on a 40M row table');
} else if (mode === 'runner-rules') {
  for (const f of fresh) {
    const raw = read(f), sql = strip(raw), noTx = raw.split('\n')[0].trim() === '-- no-transaction';
    const conc = /CONCURRENTLY/i.test(sql);
    if (conc && !noTx) fail(f + ': CONCURRENTLY cannot run inside the runner transaction; first line must be "-- no-transaction"');
    if (noTx) { const stmts = sql.split(';').map((s) => s.trim()).filter(Boolean); if (stmts.some((s) => !/CONCURRENTLY/i.test(s))) fail(f + ': a no-transaction file may only contain CONCURRENTLY statements'); }
  }
} else if (mode === 'down-files') {
  for (const f of fresh) if (!fs.existsSync('migrations/' + f.replace(/\.sql$/, '.down.sql'))) fail('missing down migration for ' + f);
} else fail('unknown mode');
