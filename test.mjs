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
