// `init.mjs --scaffold`: draft a project.config.yml from the detected stack.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export function scaffold({ target: TARGET, dry: DRY, here: HERE }) {
  const out = path.join(TARGET, 'project.config.yml');
  if (fs.existsSync(out)) { console.error(`✖ ${out} already exists. Edit it, or delete it to re-scaffold.`); process.exit(1); }
  const readJson = (f) => { try { return JSON.parse(fs.readFileSync(path.join(TARGET, f), 'utf8')); } catch { return null; } };
  const read = (f) => { try { return fs.readFileSync(path.join(TARGET, f), 'utf8'); } catch { return ''; } };
  const exists = (f) => fs.existsSync(path.join(TARGET, f));
  const stack = new Set(); let pm = '', test = '', frontend = false, backendOnly = false;

  for (const root of ['.', 'src', 'app', 'backend', 'api']) {
    const composer = readJson(path.join(root, 'composer.json'));
    if (composer) {
      pm = pm || 'composer';
      const deps = { ...composer.require, ...composer['require-dev'] };
      if (deps['laravel/framework']) { stack.add(`laravel${(String(deps['laravel/framework']).match(/(\d+)/) || [])[1] || ''}`); test = test || 'php artisan test'; }
      if (deps['livewire/livewire']) stack.add('livewire');
      if (deps['inertiajs/inertia-laravel']) stack.add('inertia');
    }
    const pkg = readJson(path.join(root, 'package.json'));
    if (pkg) {
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      pm = pm || (exists(path.join(root, 'pnpm-lock.yaml')) ? 'pnpm' : exists(path.join(root, 'yarn.lock')) ? 'yarn' : 'npm');
      const add = (k, v) => { if (deps[k]) { stack.add(v); return true; } return false; };
      if (add('next', 'nextjs') || add('react', 'react')) frontend = true;
      if (add('vue', 'vue') || add('nuxt', 'nuxt')) frontend = true;
      if (add('expo', 'expo') || add('react-native', 'reactnative')) frontend = true;
      add('express', 'express'); add('@nestjs/core', 'nest'); add('fastify', 'fastify'); add('typescript', 'typescript'); add('tailwindcss', 'tailwind');
      if (pkg.scripts && pkg.scripts.test && !test) test = `${pm} test`;
    }
  }
  const py = read('requirements.txt') + read('pyproject.toml');
  if (py) { stack.add('python'); for (const k of ['django', 'fastapi', 'flask']) if (new RegExp(k, 'i').test(py)) stack.add(k); test = test || 'pytest'; pm = pm || (exists('uv.lock') ? 'uv' : 'pip'); }
  if (exists('resources/views') || exists('src/resources/views')) stack.add('blade');
  const GRADLEW = process.platform === 'win32' ? 'gradlew.bat test' : './gradlew test';
  // other ecosystems: [marker file, stack token, package manager, test command]
  for (const [f, tok, m, t] of [
    ['go.mod', 'go', 'go', 'go test ./...'],
    ['Cargo.toml', 'rust', 'cargo', 'cargo test'],
    ['Gemfile', 'ruby', 'bundler', 'bundle exec rake test'],
    ['pom.xml', 'java', 'maven', 'mvn test'],
    ['build.gradle', 'java', 'gradle', GRADLEW],
    ['build.gradle.kts', 'kotlin', 'gradle', GRADLEW],
    ['Package.swift', 'swift', 'spm', 'swift test'],
    ['pubspec.yaml', 'flutter', 'pub', 'flutter test'],
  ]) if (exists(f)) { stack.add(tok); pm = pm || m; test = test || t; }
  if (/rails/.test(read('Gemfile'))) { stack.add('rails'); test = 'bin/rails test'; }
  if (fs.readdirSync(TARGET).some((f) => /\.(xcodeproj|xcworkspace)$/.test(f))) { stack.add('swift'); stack.add('ios'); }
  if (fs.readdirSync(TARGET).some((f) => /\.(sln|csproj)$/.test(f))) { stack.add('dotnet'); pm = pm || 'dotnet'; test = test || 'dotnet test'; }
  if (exists('bun.lockb') || exists('bun.lock')) pm = pm === 'npm' || !pm ? 'bun' : pm;
  if (exists('poetry.lock') && pm === 'pip') pm = 'poetry';

  let dockerDir = '', service = 'app', compose = '';
  for (const d of ['docker', '.']) for (const f of ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml']) {
    if (!dockerDir && exists(path.join(d, f))) { dockerDir = d; compose = read(path.join(d, f)); }
  }
  if (compose) {
    const svc = [...compose.matchAll(/^ {2}([A-Za-z0-9_-]+):\s*$/gm)].map((m) => m[1]);
    service = ['app', 'php', 'web', 'api', 'backend', 'node'].find((n) => svc.includes(n)) || svc[0] || 'app';
    if (/mysql|mariadb/i.test(compose)) stack.add('mysql');
    if (/postgres/i.test(compose)) stack.add('postgres');
  }

  let branches = []; let current = '';
  try {
    branches = execSync('git branch -a --format="%(refname:short)"', { cwd: TARGET, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split(/\r?\n/).map((b) => b.replace(/^origin\//, '').trim()).filter(Boolean);
    current = execSync('git branch --show-current', { cwd: TARGET, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { /* not a git repo */ }
  const pick = (c) => c.find((b) => branches.includes(b)) || '';
  const production = pick(['main', 'master']) || 'main';
  const integration = pick(['develop', 'dev', 'staging']);
  const hasLaravelOrApi = [...stack].some((s) => /^(laravel|express|nest|fastify|django|fastapi|flask|rails)/.test(s));
  const type = [...stack].some((s) => ['expo', 'reactnative', 'flutter', 'ios'].includes(s)) ? 'mobile' : (hasLaravelOrApi && frontend) ? 'fullstack' : (hasLaravelOrApi && !stack.has('blade') && !stack.has('livewire') && !stack.has('inertia')) ? 'api' : frontend || stack.has('blade') ? 'web' : 'other';
  void backendOnly;

  const yml = `# yaml-language-server: $schema=https://raw.githubusercontent.com/khmuhib01/agents-template/main/project.config.schema.json
# Draft generated by "init.mjs --scaffold". Review every line (marked TODO) before running init.
name: ${path.basename(TARGET)}        # TODO
description: ""                       # TODO one sentence
url: ""
type: ${type}                         # web | api | mobile | fullstack | cli | library | other
stack: [${[...stack].join(', ')}]
package_manager: ${pm}

run_in_docker: ${Boolean(dockerDir)}
docker:
  dir: ${dockerDir || 'docker'}
  service: ${service}

test_command: "${test}"               # TODO leave empty if there are no tests

branches:
  working: ${current || 'feature/x'}
  integration: ${integration}         # empty if you merge straight to production
  production: ${production}

deploy:
  mode: manual                        # TODO manual | ci
  scope: ""
  target: ""
  needs_approval: true

commit_attribution: false
docs_language: English
docs_files: [README.md]

layout:                               # TODO
  - "src/: application code"

local_only:
  - ".env"

notes:                                # TODO project-specific rules
  - ""

skills_mode: focused                  # focused = only skills routed for this type/stack (fewer tokens); all = every skill
forbid: []
agents_mirror: true
codex_mirror: true
`;
  if (DRY) { console.log(yml); return; }
  fs.writeFileSync(out, yml);
  console.log(`✔ Draft written: ${out}\n  Review it, then run: node ${path.join(HERE, 'init.mjs')} --target "${TARGET}"`);
}
