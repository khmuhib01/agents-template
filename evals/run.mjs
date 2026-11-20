#!/usr/bin/env node
// Offline skill-trigger eval: node evals/run.mjs [--verbose] [--report]
// For each prompt in cases.json, ranks every core skill by IDF-weighted word overlap between the prompt and the
// skill's name + description, and requires an expected skill in the top 3. This is a cheap regression guard for
// description quality (vague or overlapping descriptions fail), NOT a measurement of how a real model triggers skills.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const VERBOSE = process.argv.includes('--verbose');
const TOP = 3;

const STOP = new Set('a an and are as at be by do does for from how i in is it its me my of on or our so that the this to use used using we when with without you your not no any can should would will into over than then them they their there these those what which who why also about after before again all but if just more most other some such too very via per etc get make makes made'.split(' '));
const stem = (w) => w.replace(/(ing|ed|es|s)$/, '');
const tokens = (text) => text.toLowerCase().replace(/[^a-z0-9#+.\s-]/g, ' ').split(/[\s-]+/).map((w) => w.replace(/^[.#]+|[.]+$/g, '')).filter((w) => w.length > 1 && !STOP.has(w)).map(stem);

function loadSkills() {
  const dirs = [path.join(ROOT, 'core', 'skills'), path.join(ROOT, 'templates', '.claude', 'skills')];
  const out = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const f = path.join(dir, name, 'SKILL.md');
      if (!fs.existsSync(f)) continue;
      const text = fs.readFileSync(f, 'utf8');
      if (/^disable-model-invocation:\s*true/m.test(text)) continue; // manual-only: never listed to the model, a prompt cannot trigger it
      const m = text.match(/^description:\s*(.*)$/m);
      const desc = (m ? m[1] : '').replace(/^"|"$/g, '');
      out.push({ name, words: new Set([...tokens(name), ...tokens(name), ...tokens(desc)]) });
    }
  }
  return out;
}

const skills = loadSkills();
const df = new Map();
for (const s of skills) for (const w of s.words) df.set(w, (df.get(w) || 0) + 1);
const idf = (w) => Math.log(1 + skills.length / (df.get(w) || 1));

function rank(prompt, allowed) {
  const pw = new Set(tokens(prompt));
  return skills
    .filter((s) => !allowed || allowed.has(s.name))
    .map((s) => ({ name: s.name, score: [...pw].filter((w) => s.words.has(w)).reduce((n, w) => n + idf(w), 0) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

// Case files: cases.json (legacy, positive only) plus evals/triggers/*.json (schema v2). Fields per case:
//   prompt   string (required)
//   expect   [skill] at least one must rank in the top 3 (omit for a pure negative case)
//   expect_all [skill] every one must rank in the top 5 (multi-skill scenarios)
//   not      [skill] none of these may rank in the top 3 (negative / hard-negative cases)
//   tags     [string] free labels, e.g. "version", "regression", "negative", "multi"
import { loadCases } from './lib.mjs';
const cases = loadCases('all', HERE);
const known = new Set(skills.map((s) => s.name));
// Opt-in skills (only reachable through `domains` in skill-map.json) are not in a project's skill list unless the domain is enabled,
// so they only compete in a case when the case names the domain (`domains: [...]`) or names one of their skills in expect/expect_all/not.
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'core', 'skill-map.json'), 'utf8'));
const routed = new Set([...MAP.always, ...Object.values(MAP.types).flat(), ...Object.values(MAP.stack).flat()]);
const domainsOf = new Map();
for (const [dom, list] of Object.entries(MAP.domains || {})) for (const sk of list) if (!routed.has(sk)) domainsOf.set(sk, [...(domainsOf.get(sk) || []), dom]);
function candidates(c) {
  const on = new Set(c.domains || []);
  for (const n of [...(c.expect || []), ...(c.expect_all || []), ...(c.not || [])]) for (const d of domainsOf.get(n) || []) on.add(d);
  return new Set(skills.map((s) => s.name).filter((n) => !domainsOf.has(n) || domainsOf.get(n).some((d) => on.has(d))));
}
const stat = new Map(); // per skill: tp (expected and found), fn (expected, missed), fp (forbidden but found)
const bump = (n, k) => { const o = stat.get(n) || { tp: 0, fn: 0, fp: 0 }; o[k]++; stat.set(n, o); };
let failed = 0;
for (const c of cases) {
  const exp = c.expect || [], all = c.expect_all || [], not = c.not || [];
  const bad = [...exp, ...all, ...not].filter((e) => !known.has(e));
  if (bad.length || (!exp.length && !all.length && !not.length)) { failed++; console.error(`  ✖ case "${c.prompt}" (${c.file}) ${bad.length ? 'references unknown skill(s): ' + bad.join(', ') : 'has no expectation'}`); continue; }
  const ranked = rank(c.prompt, candidates(c)).map((r) => r.name);
  const top = ranked.slice(0, TOP), top5 = ranked.slice(0, 5);
  const okExp = !exp.length || exp.some((e) => top.includes(e));
  const okAll = all.every((e) => top5.includes(e));
  const hitNot = not.filter((e) => top.includes(e));
  const ok = okExp && okAll && !hitNot.length;
  if (exp.length) bump(exp.find((e) => top.includes(e)) || exp[0], okExp ? 'tp' : 'fn');
  for (const e of all) bump(e, top5.includes(e) ? 'tp' : 'fn');
  for (const e of hitNot) bump(e, 'fp');
  if (!ok) failed++;
  if (!ok || VERBOSE) console.log(`  ${ok ? '✔' : '✖'} "${c.prompt}" → [${top.join(', ')}]${exp.length ? ` (expected one of: ${exp.join(', ')})` : ''}${all.length ? ` (expected all of: ${all.join(', ')} in top 5)` : ''}${not.length ? ` (must not include: ${not.join(', ')})` : ''}`);
}
console.log(`${cases.length - failed}/${cases.length} cases pass (top ${TOP} for expect/not, top 5 for expect_all).`);
if (process.argv.includes('--report')) {
  console.log('\nper skill (recall = tp/(tp+fn), false positives = forbidden skill ranked in top 3):');
  for (const [n, o] of [...stat].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`  ${n.padEnd(28)} tp ${o.tp}  fn ${o.fn}  fp ${o.fp}  recall ${(o.tp + o.fn ? (100 * o.tp / (o.tp + o.fn)).toFixed(0) : '-')}%`);
  console.log('Offline lexical ranking only: a description-quality guard, not a measurement of a real model.');
}
process.exit(failed ? 1 : 0);
