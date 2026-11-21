#!/usr/bin/env node
// Offline: composes recorded scenario runs into "routed" vs "all strong model", no API call.
//   node evals/routing-ab.mjs --cheap a.json[,b.json] --strong a.json[,b.json] [--json]
// For each scenario the classifier (lib/routing-tasks.mjs) reads the prompt: `simple` goes to the cheap model, everything else to the strong one.
// Costs and pass rates are the MEASURED per-scenario means from the files; the routed total is a composition of them, not a separate run.
// Escalation (optional column): if a cheap run fails and the failure is detected (a test command), one strong run follows.
//   cost = cheap + (1 - p_cheap) * strong, success = p_cheap + (1 - p_cheap) * p_strong. This is a model built on the measured rates, not a measurement.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyTask } from '../lib/routing-tasks.mjs';
import { loadScenario } from './scenario-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export function means(files) {
  const by = {};
  for (const f of files) for (const r of JSON.parse(fs.readFileSync(f, 'utf8')).runs) {
    const x = (by[r.scenario] = by[r.scenario] || { n: 0, pass: 0, cost: 0 });
    x.n++; x.pass += r.pass ? 1 : 0; x.cost += r.cost;
  }
  return Object.fromEntries(Object.entries(by).map(([k, v]) => [k, { n: v.n, p: v.pass / v.n, cost: v.cost / v.n }]));
}

// cheap/strong: output of means(); level(id): 'simple' | 'medium' | 'complex'. Only scenarios measured on both models are compared.
export function compose(cheap, strong, level) {
  const rows = [];
  for (const id of Object.keys(strong).filter((k) => cheap[k]).sort()) {
    const c = cheap[id], s = strong[id], lv = level(id);
    const useCheap = lv === 'simple';
    const routed = useCheap ? c : s;
    rows.push({ id, level: lv, cheapN: c.n, strongN: s.n, strong: s, routed, routedModel: useCheap ? 'cheap' : 'strong',
      escalated: useCheap ? { p: c.p + (1 - c.p) * s.p, cost: c.cost + (1 - c.p) * s.cost } : s });
  }
  const tot = (pick) => {
    const cost = rows.reduce((n, r) => n + pick(r).cost, 0), succ = rows.reduce((n, r) => n + pick(r).p, 0);
    return { cost, successes: succ, rate: rows.length ? succ / rows.length : 0, perPass: succ ? cost / succ : null };
  };
  const base = tot((r) => r.strong), routed = tot((r) => r.routed), esc = tot((r) => r.escalated);
  const red = (x) => (base.perPass && x.perPass ? ((base.perPass - x.perPass) / base.perPass) * 100 : null);
  return { rows, base, routed, esc, reduction: red(routed), reductionEscalated: red(esc) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const opt = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1].split(',') : null; };
  const cheapF = opt('--cheap'), strongF = opt('--strong');
  if (!cheapF || !strongF) { console.error('usage: node evals/routing-ab.mjs --cheap a.json[,b.json] --strong a.json[,b.json] [--json]'); process.exit(2); }
  const level = (id) => classifyTask(loadScenario(id).prompt).level;
  const out = compose(means(cheapF), means(strongF), level);
  if (a.includes('--json')) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
  const usd = (n) => `$${n.toFixed(3)}`;
  console.log('scenario'.padEnd(28) + 'level'.padEnd(9) + 'runs c/s'.padEnd(10) + 'cheap pass/cost'.padEnd(20) + 'strong pass/cost'.padEnd(20) + 'routed to');
  for (const r of out.rows) {
    const c = cheapF && means(cheapF)[r.id];
    console.log(r.id.padEnd(28) + r.level.padEnd(9) + `${r.cheapN}/${r.strongN}`.padEnd(10) + `${(c.p * 100).toFixed(0)}% ${usd(c.cost)}`.padEnd(20) + `${(r.strong.p * 100).toFixed(0)}% ${usd(r.strong.cost)}`.padEnd(20) + r.routedModel);
  }
  const line = (n, x) => `${n.padEnd(34)} success ${(x.rate * 100).toFixed(0).padStart(3)}%  mean cost/task ${usd(x.cost / out.rows.length)}  cost per passing task ${x.perPass ? usd(x.perPass) : 'n/a'}`;
  console.log('\n' + line('all strong model (baseline)', out.base) + '\n' + line('routed (measured rates)', out.routed) + '\n' + line('routed + escalate (modeled)', out.esc));
  console.log(`\nCredit reduction vs baseline, cost per passing task: routed ${out.reduction === null ? 'n/a' : out.reduction.toFixed(1) + '%'}, routed + escalate ${out.reductionEscalated === null ? 'n/a' : out.reductionEscalated.toFixed(1) + '%'} (negative = costs more).`);
  console.log('Composed from recorded per-scenario means; tokens are not recorded. Small run counts: treat differences of a few points as noise.');
}
