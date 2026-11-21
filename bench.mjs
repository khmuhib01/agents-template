#!/usr/bin/env node
// Reproducible static-context benchmark: node bench.mjs [--json]
// Generates sample projects and compares the always-loaded context (tokens re-sent every session, ~4 chars/token)
// of the generated setup against an "unoptimized" setup built from the same files:
//   unoptimized = every installed skill description is listed (no manual-only skills), path-scoped rules always load.
// This measures STATIC context only. It does not measure real API cost, which also depends on model choice,
// conversation length and prompt caching. Treat it as a floor for what the template saves, not a billing figure.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES = {
  'laravel (focused, default)': 'name: Laravel App\ntype: web\nstack: [laravel8, blade, mysql]\npackage_manager: composer\ntest_command: "php artisan test"\nbranches: {working: dev1, integration: develop, production: main}\n',
  'expo mobile (focused, default)': 'name: Mobile\ntype: mobile\nstack: [expo, typescript]\npackage_manager: pnpm\ntest_command: "pnpm test"\nbranches: {working: feature/x, integration: "", production: main}\n',
  'python api (skills_mode: all)': 'name: Api\ntype: api\nstack: [python, fastapi, postgres]\npackage_manager: uv\ntest_command: pytest\nskills_mode: all\nbranches: {working: x, integration: develop, production: main}\n',
};
const fm = (f) => { const m = fs.readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/); return m ? m[1] : ''; };
const desc = (f) => (fm(f).match(/^description:\s*(.*)$/m) || [, ''])[1];
const size = (f) => (fs.existsSync(f) ? fs.statSync(f).size : 0);
const md = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.md')).map((f) => path.join(d, f)) : []);
const tok = (chars) => Math.round(chars / 4);

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-'));
const rows = [];
for (const [label, yml] of Object.entries(SAMPLES)) {
  const dir = path.join(base, label.replace(/\W+/g, '-'));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'project.config.yml'), yml);
  const r = spawnSync(process.execPath, [path.join(HERE, 'init.mjs'), '--target', dir], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(`✖ init failed for ${label}\n${r.stderr}`); process.exit(1); }
  const c = path.join(dir, '.claude');
  const instr = size(path.join(dir, 'CLAUDE.md')) + size(path.join(c, 'CLAUDE.md'));
  const agents = md(path.join(c, 'agents')).reduce((n, f) => n + path.basename(f).length + desc(f).length, 0);
  const skills = fs.existsSync(path.join(c, 'skills')) ? fs.readdirSync(path.join(c, 'skills')) : [];
  const skillChars = (all) => skills.reduce((n, s) => {
    const f = path.join(c, 'skills', s, 'SKILL.md');
    if (!fs.existsSync(f)) return n;
    const manual = /^disable-model-invocation:\s*true/m.test(fm(f));
    return n + (!all && manual ? 0 : s.length + desc(f).length);
  }, 0);
  const rules = md(path.join(c, 'rules'));
  const ruleChars = (all) => rules.filter((f) => all || !/^paths:/m.test(fm(f))).reduce((n, f) => n + size(f), 0);
  const optimized = tok(instr + agents + skillChars(false) + ruleChars(false));
  const unoptimized = tok(instr + agents + skillChars(true) + ruleChars(true));
  const parts = { instructions: tok(instr), agents: tok(agents), skills: tok(skillChars(false)), rules: tok(ruleChars(false)) };
  rows.push({ project: label, skills: skills.length, parts, unoptimized, optimized, saved: unoptimized - optimized, pct: Math.round(((unoptimized - optimized) / unoptimized) * 100) });
}
fs.rmSync(base, { recursive: true, force: true });
if (process.argv.includes('--json')) { console.log(JSON.stringify(rows, null, 2)); process.exit(0); }
console.log('Always-loaded context per session (est. tokens, ~4 chars/token)\n');
console.log('project'.padEnd(30) + 'skills'.padStart(7) + 'unoptimized'.padStart(13) + 'generated'.padStart(11) + 'saved'.padStart(8));
for (const r of rows) console.log(r.project.padEnd(30) + String(r.skills).padStart(7) + String(r.unoptimized).padStart(13) + String(r.optimized).padStart(11) + `${r.saved} (${r.pct}%)`.padStart(14));
console.log('\nWhere the generated context goes (est. tokens)\n');
for (const r of rows) console.log(r.project.padEnd(30) + Object.entries(r.parts).map(([k, v]) => `${k} ${v}`).join('  ·  '));
// Agent invocations per task under the delegation policy, offline and deterministic: counts agents the policy would run, not tokens or cost.
// Baseline = a planner, architect, security reviewer and code reviewer on every task (4). This is a policy count; it says nothing about real spend.
{
  const { classifyTask, selectAgents } = await import('./lib/routing-tasks.mjs');
  const cases = JSON.parse(fs.readFileSync(path.join(HERE, 'evals', 'routing-cases.json'), 'utf8'));
  const hit = cases.filter((c) => classifyTask(c.goal).level === c.level).length;
  const picked = cases.reduce((n, c) => n + selectAgents(c.goal, classifyTask(c.goal).level).length, 0);
  console.log(`\nAgent selection over ${cases.length} labeled goals (evals/routing-cases.json): classifier ${hit}/${cases.length} correct; agents invoked ${picked} vs ${cases.length * 4} when all four run every time (policy count, not measured cost).`);
}
console.log('\nStatic context only; real cost also depends on model, conversation length and prompt caching.');
