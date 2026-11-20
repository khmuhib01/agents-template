// Shared pure helpers for the eval tooling (no network, no side effects beyond reading case files).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Case files: cases.json (legacy, positive only) and evals/triggers/*.json (schema v2). Returns [{...case, file, suite}].
export function loadCases(suite = 'all', dir = HERE) {
  const out = [];
  const add = (f, s) => JSON.parse(fs.readFileSync(f, 'utf8')).forEach((c) => out.push({ ...c, file: path.basename(f), suite: s }));
  if (suite !== 'triggers') add(path.join(dir, 'cases.json'), 'legacy');
  const t = path.join(dir, 'triggers');
  if (suite !== 'legacy' && fs.existsSync(t)) for (const f of fs.readdirSync(t).sort()) if (f.endsWith('.json')) add(path.join(t, f), 'triggers');
  return out;
}

// Scores one case against the list of skills a model chose. In live mode the optional live_expect_all / live_not fields
// (the intended expectation that lexical ranking cannot check) are added to expect_all / not.
export function scoreCase(c, got, live = false) {
  const exp = c.expect || [];
  const all = [...(c.expect_all || []), ...(live ? c.live_expect_all || [] : [])];
  const not = [...(c.not || []), ...(live ? c.live_not || [] : [])];
  const okExp = !exp.length || exp.some((e) => got.includes(e));
  const okAll = all.every((e) => got.includes(e));
  const hitNot = not.filter((e) => got.includes(e));
  return { ok: okExp && okAll && !hitNot.length, missed: [...(okExp ? [] : exp), ...all.filter((e) => !got.includes(e))], forbidden: hitNot };
}

// results: [{ case, got: [skill], ok, missed, forbidden }] (one entry per call). Returns per-skill counts and totals.
export function summarize(results) {
  const per = {};
  const bump = (n, k) => { per[n] = per[n] || { tp: 0, fn: 0, fp: 0 }; per[n][k]++; };
  for (const r of results) {
    const c = r.case;
    const exp = c.expect || [];
    if (exp.length) bump(exp.find((e) => r.got.includes(e)) || exp[0], exp.some((e) => r.got.includes(e)) ? 'tp' : 'fn');
    for (const e of [...(c.expect_all || []), ...(c.live_expect_all || [])]) bump(e, r.got.includes(e) ? 'tp' : 'fn');
    for (const e of r.forbidden) bump(e, 'fp');
  }
  for (const o of Object.values(per)) {
    o.recall = o.tp + o.fn ? o.tp / (o.tp + o.fn) : null;
    o.precision = o.tp + o.fp ? o.tp / (o.tp + o.fp) : null;
  }
  const passed = results.filter((r) => r.ok).length;
  return { calls: results.length, passed, passRate: results.length ? passed / results.length : null, per };
}
