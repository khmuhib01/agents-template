#!/usr/bin/env node
// Offline skill-trigger eval: node evals/run.mjs [--verbose]
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

function rank(prompt) {
  const pw = new Set(tokens(prompt));
  return skills
    .map((s) => ({ name: s.name, score: [...pw].filter((w) => s.words.has(w)).reduce((n, w) => n + idf(w), 0) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

const cases = JSON.parse(fs.readFileSync(path.join(HERE, 'cases.json'), 'utf8'));
const known = new Set(skills.map((s) => s.name));
let failed = 0;
for (const c of cases) {
  const bad = c.expect.filter((e) => !known.has(e));
  if (bad.length) { failed++; console.error(`  ✖ case "${c.prompt}" expects unknown skill(s): ${bad.join(', ')}`); continue; }
  const top = rank(c.prompt).slice(0, TOP).map((r) => r.name);
  const ok = c.expect.some((e) => top.includes(e));
  if (!ok) failed++;
  if (!ok || VERBOSE) console.log(`  ${ok ? '✔' : '✖'} "${c.prompt}" → [${top.join(', ')}] (expected one of: ${c.expect.join(', ')})`);
}
console.log(`${cases.length - failed}/${cases.length} prompts rank an expected skill in the top ${TOP}.`);
process.exit(failed ? 1 : 0);
