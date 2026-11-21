#!/usr/bin/env node
// Static context cost per skill (free, offline): node evals/context.mjs [--all]
// Estimates the always-loaded description tokens (chars / 4, same rule as init.mjs and bench.mjs) of the skills routed into every
// project (`always` in core/skill-map.json), next to how many offline eval cases expect each skill. Manual-only skills cost 0 because
// they are never listed to the model. This measures description tokens only; it says nothing about extra turns or tool reads.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCases } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'core', 'skill-map.json'), 'utf8'));
const cases = loadCases('all', HERE);
const SHOW_ALL = process.argv.includes('--all');

function meta(name) {
  for (const d of ['core/skills', 'templates/.claude/skills']) {
    const f = path.join(ROOT, d, name, 'SKILL.md');
    if (!fs.existsSync(f)) continue;
    const fm = fs.readFileSync(f, 'utf8').split('---')[1] || '';
    const desc = (fm.match(/^description:\s*(.*)$/m) || [, ''])[1];
    return { manual: /^disable-model-invocation:\s*true/m.test(fm), tokens: Math.round((name.length + desc.length) / 4) };
  }
  return null;
}
const rows = [];
const names = SHOW_ALL ? fs.readdirSync(path.join(ROOT, 'core', 'skills')).sort() : map.always;
for (const name of names) {
  const m = meta(name);
  if (!m) continue;
  const expect = cases.filter((c) => [...(c.expect || []), ...(c.expect_all || [])].includes(name)).length;
  rows.push({ name, always: map.always.includes(name), ...m, tokens: m.manual ? 0 : m.tokens, expect });
}
rows.sort((a, b) => b.tokens - a.tokens || a.name.localeCompare(b.name));
console.log('skill'.padEnd(28) + 'always  invocable  desc tokens  eval cases expecting it');
for (const r of rows) console.log(`${r.name.padEnd(28)}${String(r.always).padEnd(8)}${String(!r.manual).padEnd(11)}${String(r.tokens).padEnd(12)}${r.expect}`);
const sum = (f) => rows.filter(f).reduce((n, r) => n + r.tokens, 0);
console.log(`\nalways-routed description tokens: ${sum((r) => r.always)} (${rows.filter((r) => r.always && !r.manual).length} model-invocable skills)`);
if (SHOW_ALL) console.log(`all core skills description tokens: ${sum(() => true)}`);
console.log('Estimate only (chars/4). Savings from removing a skill from `always` = its row; real session cost also depends on turns and tool reads.');
