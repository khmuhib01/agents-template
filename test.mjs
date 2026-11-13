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
