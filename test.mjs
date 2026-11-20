#!/usr/bin/env node
// Smoke test for init.mjs: node test.mjs
// Runs init against several sample configs in a temp dir and checks the output.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INIT = path.join(HERE, 'init.mjs');
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-template-test-'));
let failed = 0;
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

console.log('\n[core rules]');
{
  const d = path.join(base, 'laravel-docker');
  for (const f of ['CODE-QUALITY', 'SECURITY', 'TESTING', 'COMPLETION-REPORT', 'COMMANDS-TESTING']) check(fs.existsSync(path.join(d, '.claude/rules', `${f}.md`)), `rule installed: ${f}.md`);
  const total = fs.readdirSync(path.join(d, '.claude/rules')).reduce((n, f) => n + fs.statSync(path.join(d, '.claude/rules', f)).size, 0);
  check(total < 12000, `rules stay small (always-loaded): ${total} bytes < 12000`);
}

console.log('\n[catalog]');
{
  const map = JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8'));
  const coreSkills = fs.readdirSync(path.join(HERE, 'core', 'skills'));
  const tplSkills = fs.readdirSync(path.join(HERE, 'templates', '.claude', 'skills'));
  const known = new Set([...coreSkills, ...tplSkills]);
  const referenced = new Set([...map.always, ...Object.values(map.types).flat(), ...Object.values(map.stack).flat()]);
  const dangling = [...referenced].filter((s) => !known.has(s));
  check(dangling.length === 0, `skill-map.json references only existing skills${dangling.length ? ': ' + dangling.join(', ') : ''}`);
  const fm = (f) => { const m = fs.readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/); const o = {}; if (m) for (const l of m[1].split(/\r?\n/)) { const i = l.indexOf(':'); if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, ''); } return o; };
  const badSkills = []; const longDesc = [];
  for (const s of coreSkills) {
    const f = path.join(HERE, 'core', 'skills', s, 'SKILL.md');
    const o = fs.existsSync(f) ? fm(f) : {};
    if (o.name !== s || !o.description || !/^Use /.test(o.description)) badSkills.push(s);
    if ((o.description || '').length > 320) longDesc.push(s);
  }
  check(badSkills.length === 0, `every core skill has frontmatter name == folder and a "Use ..." description${badSkills.length ? ': ' + badSkills.join(', ') : ''}`);
  check(longDesc.length === 0, `skill descriptions stay <= 320 chars (loaded every session)${longDesc.length ? ': ' + longDesc.join(', ') : ''}`);
  const badAgents = fs.readdirSync(path.join(HERE, 'core', 'agents')).filter((f) => { const o = fm(path.join(HERE, 'core', 'agents', f)); return o.name !== f.replace(/\.md$/, '') || !o.description; });
  check(badAgents.length === 0, `every agent has frontmatter name == file and a description${badAgents.length ? ': ' + badAgents.join(', ') : ''}`);
  const orphans = coreSkills.filter((s) => !referenced.has(s));
  check(orphans.length === 0, `every core skill is routed by skill-map.json${orphans.length ? ' (orphans: ' + orphans.join(', ') + ')' : ''}`);
}

console.log('\n[skill routing eval]');
{
  const r = spawnSync(process.execPath, [path.join(HERE, 'evals', 'run.mjs')], { encoding: 'utf8' });
  check(r.status === 0, `offline skill-trigger eval passes (${(r.stdout.match(/^\d+\/\d+ prompts.*$/m) || [''])[0]})${r.status ? '\n' + r.stdout : ''}`);
}

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
  fs.writeFileSync(path.join(unk, 'project.config.yml'), 'name: U\ntype: other\nstack: [cobol]\nbranches: {working: a, production: main}\n');
  const ur = run(unk);
  check(ur.status === 0 && /matched no skill: cobol/.test(ur.stderr), 'unknown stack token warns but still generates');
  check(/Skills: \d+ installed \(~\d+ tokens/.test(ur.stdout) && /skills_mode: focused would install/.test(ur.stdout), 'init reports skill token overhead and the focused saving');
}

console.log('\n[forbid]');
const bad = path.join(base, 'forbid');
fs.mkdirSync(bad, { recursive: true });
fs.writeFileSync(path.join(bad, 'project.config.yml'), 'name: Bad\ntype: web\nstack: [laravel]\nbranches: {working: a, integration: develop, production: main}\nnotes:\n  - "copied from oldproject"\nforbid: [oldproject]\n');
check(run(bad).status === 1, 'forbidden term makes init fail');

// scaffold detects a non-JS/PHP stack and the draft config generates cleanly
console.log('\n[scaffold-go]');
const go = path.join(base, 'go-cli'); fs.mkdirSync(go);
fs.writeFileSync(path.join(go, 'go.mod'), 'module example.com/x\n');
const sc = spawnSync(process.execPath, [INIT, '--scaffold', '--target', go], { encoding: 'utf8' });
const draft = fs.existsSync(path.join(go, 'project.config.yml')) ? fs.readFileSync(path.join(go, 'project.config.yml'), 'utf8') : '';
check(sc.status === 0 && /stack: \[go\]/.test(draft) && /type: other/.test(draft) && /go test/.test(draft), 'scaffold detects go (type other, go test)');
check(/skills_mode: focused/.test(draft), 'scaffold drafts skills_mode: focused');
check(run(go).status === 0, 'init accepts the scaffolded go config');
check(fs.existsSync(path.join(go, '.claude/skills/go-development/SKILL.md')) && /`go-development`/.test(fs.readFileSync(path.join(go, '.claude/CLAUDE.md'), 'utf8')), 'go project routes to go-development');

console.log('\n[invalid config]');
const inv = path.join(base, 'invalid');
fs.mkdirSync(inv, { recursive: true });
fs.writeFileSync(path.join(inv, 'project.config.yml'), 'name: X\ntype: banana\nstack: [laravel]\nbranches: {working: a, production: main}\n');
check(run(inv).status === 1, 'bad type is rejected');

fs.rmSync(base, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
