#!/usr/bin/env node
// Smoke test for init.mjs: node test.mjs
// Runs init against several sample configs in a temp dir and checks the output.
import fs from 'node:fs';
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
}

}

if (on('invalid config')) {
console.log('\n[invalid config]');
const inv = path.join(base, 'invalid');
fs.mkdirSync(inv, { recursive: true });
fs.writeFileSync(path.join(inv, 'project.config.yml'), 'name: X\ntype: banana\nstack: [laravel]\nbranches: {working: a, production: main}\n');
check(run(inv).status === 1, 'bad type is rejected');
}

fs.rmSync(base, { recursive: true, force: true });
if (LIST) { fs.rmSync(base, { recursive: true, force: true }); process.exit(0); }
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
