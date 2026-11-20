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
  check(/Skills: \d+ installed, \d+ model-invocable \(~\d+ tokens/.test(ur.stdout) && /skills_mode: focused would install/.test(ur.stdout), 'init reports skill token overhead and the focused saving');
}

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
