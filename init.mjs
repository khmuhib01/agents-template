#!/usr/bin/env node
// claude-template init — reads project.config.yml and generates AGENTS.md, CLAUDE.md and .claude/ for a project.
// Zero dependencies. Usage:
//   node init.mjs [--target DIR] [--config FILE] [--dry-run]   generate / update (safe to re-run)
//   node init.mjs --scaffold [--target DIR]                    write a draft project.config.yml from detected stack
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const has = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };

if (has('--help') || has('-h')) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 6).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}

const TEMPLATE_VERSION = fs.readFileSync(path.join(HERE, 'VERSION'), 'utf8').trim();
const TARGET = path.resolve(opt('--target', process.cwd()));
const CONFIG = path.resolve(opt('--config', path.join(TARGET, 'project.config.yml')));
const DRY = has('--dry-run');

// ---------------------------------------------------------------- YAML subset
function stripComment(line) {
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === q) q = null; }
    else if (c === '"' || c === "'") q = c;
    else if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
  }
  return line;
}
function splitTop(s) {
  const out = []; let depth = 0, q = null, cur = '';
  for (const c of s) {
    if (q) { cur += c; if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '[' || c === '{') depth++;
    if (c === ']' || c === '}') depth--;
    if (c === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim() !== '') out.push(cur);
  return out.map((x) => x.trim()).filter((x) => x !== '');
}
function scalar(s) {
  s = s.trim();
  if (s === '') return '';
  if ((s[0] === '"' && s.endsWith('"') && s.length > 1) || (s[0] === "'" && s.endsWith("'") && s.length > 1)) return s.slice(1, -1);
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return '';
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s[0] === '[' && s.endsWith(']')) return splitTop(s.slice(1, -1)).map(scalar);
  if (s[0] === '{' && s.endsWith('}')) {
    const o = {};
    for (const part of splitTop(s.slice(1, -1))) { const i = part.indexOf(':'); o[part.slice(0, i).trim()] = scalar(part.slice(i + 1)); }
    return o;
  }
  return s;
}
function parseYaml(text) {
  const lines = text.split(/\r?\n/).map(stripComment).filter((l) => l.trim() !== '')
    .map((l) => ({ indent: l.match(/^ */)[0].length, text: l.trim() }));
  let pos = 0;
  const list = (indent) => {
    const arr = [];
    while (pos < lines.length && lines[pos].indent === indent && lines[pos].text.startsWith('-')) { arr.push(scalar(lines[pos].text.slice(1))); pos++; }
    return arr;
  };
  const map = (indent) => {
    const obj = {};
    while (pos < lines.length && lines[pos].indent === indent) {
      const m = lines[pos].text.match(/^([A-Za-z0-9_.-]+):(?:\s+(.*))?$/);
      if (!m) throw new Error(`Cannot parse line: "${lines[pos].text}"`);
      pos++;
      if (m[2] !== undefined && m[2] !== '') obj[m[1]] = scalar(m[2]);
      else if (pos < lines.length && lines[pos].indent > indent) obj[m[1]] = lines[pos].text.startsWith('-') ? list(lines[pos].indent) : map(lines[pos].indent);
      else obj[m[1]] = '';
    }
    if (pos < lines.length && lines[pos].indent > indent) throw new Error(`Bad indentation near: "${lines[pos].text}"`);
    return obj;
  };
  return lines.length ? map(lines[0].indent) : {};
}

// ---------------------------------------------------------------- scaffold (detect stack)
function scaffold() {
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

  const yml = `# Draft generated by "init.mjs --scaffold". Review every line (marked TODO) before running init.
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

forbid: []
agents_mirror: true
codex_mirror: true
`;
  if (DRY) { console.log(yml); return; }
  fs.writeFileSync(out, yml);
  console.log(`✔ Draft written: ${out}\n  Review it, then run: node ${path.join(HERE, 'init.mjs')} --target "${TARGET}"`);
}

// ---------------------------------------------------------------- render
const missing = new Set();
const get = (ctx, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);
const truthy = (v) => (Array.isArray(v) ? v.length > 0 : !(v === undefined || v === null || v === false || v === '' || v === 'false'));
function render(tpl, ctx) {
  tpl = tpl.replace(/\{\{#if ([\w.]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, k, a, b) => (truthy(get(ctx, k)) ? a : (b || '')));
  tpl = tpl.replace(/\{\{([\w.]+)\}\}/g, (m, k) => {
    const v = get(ctx, k);
    if (v === undefined) { missing.add(k); return m; }
    return Array.isArray(v) ? v.join(', ') : String(v);
  });
  return tpl.replace(/\n{3,}/g, '\n\n');
}

// ---------------------------------------------------------------- context
const toArr = (v) => (Array.isArray(v) ? v.filter((x) => x !== '') : v === '' || v === undefined ? [] : [v]);
const bullets = (a) => a.map((x) => `- ${x}`).join('\n');
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

function buildContext(c) {
  const d = { ...c };
  d.stack = toArr(c.stack);
  d.stack_list = d.stack.join(', ');
  const b = c.branches || {};
  d.branch_flow = b.integration ? `${b.working} → ${b.integration} → ${b.production}` : `${b.working} → ${b.production}`;

  const dk = c.docker || {};
  const cd = dk.dir && dk.dir !== '.' ? `cd ${dk.dir} && ` : '';
  d.exec_prefix = c.run_in_docker ? `${cd}docker compose exec ${dk.service || 'app'}` : '';
  d.test_cmd_full = c.test_command ? `${d.exec_prefix ? d.exec_prefix + ' ' : ''}${c.test_command}` : '';
  d.test_step = d.test_cmd_full ? `Run the tests: \`${d.test_cmd_full}\`. Abort on failure.` : 'No test command is configured: say clearly that tests were NOT run, and ask before continuing.';
  d.verify_text = d.test_cmd_full ? `Run \`${d.test_cmd_full}\` before marking work complete.` : 'No test command is configured; state that tests were not run instead of claiming a pass.';
  d.exec_text = c.run_in_docker
    ? `Run project commands (PHP, Node, package managers) inside the \`${dk.service || 'app'}\` container: \`${d.exec_prefix} <command>\`${dk.workdir_note ? ` (${dk.workdir_note})` : ''}. Never run them on the host.`
    : `Run project commands directly on the host${c.package_manager ? ` with \`${c.package_manager}\`` : ''}.`;

  const dp = c.deploy || {};
  const scope = dp.scope ? ` On the server touch only \`${dp.scope}\`.` : '';
  d.deploy_text = dp.mode === 'ci'
    ? `Pushing \`${b.production}\` triggers CI/CD${dp.target ? ` (${dp.target})` : ''}. ${dp.needs_approval === false ? '' : 'Confirm with the user before pushing it.'}${scope}`
    : `Deployment is manual; pushing does not deploy. Never deploy without explicit approval.${scope}`;
  d.attribution_text = c.commit_attribution
    ? 'Commit and PR attribution lines are allowed.'
    : 'Do not add `Co-Authored-By` or "Generated with" lines to commits or PRs.';
  d.docs_language = c.docs_language || 'English';
  d.docs_files = toArr(c.docs_files).length ? toArr(c.docs_files) : ['README.md'];
  d.docs_list = d.docs_files.map((f) => `\`${f}\``).join(', ');
  d.layout_list = bullets(toArr(c.layout).map((x) => { const i = String(x).indexOf(':'); return i > 0 ? `\`${String(x).slice(0, i).trim()}\` — ${String(x).slice(i + 1).trim()}` : x; }));
  d.local_only_list = bullets(toArr(c.local_only).map((x) => `\`${x}\``));
  d.local_only_text = toArr(c.local_only).map((x) => `\`${x}\``).join(', ');
  d.notes_list = bullets(toArr(c.notes));
  d.url = c.url || '';
  d.description = c.description || '';
  d.package_manager = c.package_manager || '';
  d.skill_routing = skillRouting(d);
  return d;
}

// Read-deny rules: secrets, local-only paths (dumps) and heavy generated folders are never opened (also saves tokens).
function denyRules(cfg, ctx) {
  const rules = [];
  if (cfg.protect_secrets !== false) {
    rules.push('Read(./.env)', 'Read(./**/.env)', 'Read(./**/.env.local)', 'Read(./**/.env.production)');
    for (const raw of toArr(cfg.local_only)) {
      const e = String(raw).trim().replace(/^\.?\//, '');
      if (!e || e === '.env') continue;
      if (e.endsWith('/')) rules.push(`Read(./${e}**)`);
      else if (e.startsWith('*')) rules.push(`Read(./**/${e})`);
      else rules.push(`Read(./${e})`);
    }
  }
  if (cfg.deny_heavy !== false) {
    const t = ctx.stack.map(norm).join(' ');
    const has = (...ks) => ks.some((k) => t.includes(k));
    const pm = String(cfg.package_manager || '');
    rules.push('Read(./**/*.min.js)', 'Read(./**/*.map)');
    if (has('laravel', 'php') || pm === 'composer') rules.push('Read(./**/vendor/**)', 'Read(./**/storage/logs/**)');
    if (has('node', 'react', 'next', 'vue', 'nuxt', 'expo', 'nest', 'express', 'typescript') || ['npm', 'pnpm', 'yarn'].includes(pm)) rules.push('Read(./**/node_modules/**)', 'Read(./**/dist/**)', 'Read(./**/build/**)', 'Read(./**/.next/**)');
    if (has('python', 'django', 'fastapi', 'flask') || ['pip', 'uv', 'poetry'].includes(pm)) rules.push('Read(./**/.venv/**)', 'Read(./**/__pycache__/**)');
  }
  return rules;
}

// Safe read-only commands (and the test command) run without a permission prompt: fewer turns, fewer tokens.
function allowRules(ctx) {
  const rules = ['Bash(git status:*)', 'Bash(git diff:*)', 'Bash(git log:*)', 'Bash(git remote -v)', 'Bash(git branch --show-current)'];
  if (ctx.test_command) {
    const prefix = ctx.exec_prefix ? ctx.exec_prefix.replace(/^cd .*? && /, '') + ' ' : '';
    rules.push(`Bash(${prefix}${ctx.test_command}:*)`);
  }
  return rules;
}

function skillRouting(d) {
  const map = JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8'));
  const installed = new Set([...fs.readdirSync(path.join(HERE, 'core', 'skills')), ...fs.readdirSync(path.join(HERE, 'templates', '.claude', 'skills'))]);
  const focus = new Set(toArr(map.types[d.type]));
  d.unmatched_stack = [];
  for (const token of d.stack.map(norm)) {
    let hit = false;
    for (const [key, skills] of Object.entries(map.stack)) {
      if (token === key || (token.startsWith(key) && /^(\d*|js)$/.test(token.slice(key.length)))) { skills.forEach((s) => focus.add(s)); hit = true; }
    }
    if (!hit) d.unmatched_stack.push(token);
  }
  const always = map.always.filter((s) => installed.has(s));
  const focusList = [...focus].filter((s) => installed.has(s) && !always.includes(s));
  d.routed_set = new Set([...always, ...focusList]);
  const rest = [...installed].filter((s) => !focus.has(s) && !always.includes(s)).sort();
  const fmt = (a) => a.map((s) => `\`${s}\``).join(', ');
  return [
    `**Primary for this project** (${d.type}; ${d.stack_list || 'no stack set'}): ${focusList.length ? fmt(focusList) : '_none matched — set `stack` in project.config.yml_'}`,
    `**Always useful:** ${fmt(always)}`,
    `**Also installed, use only when the task needs them:** ${fmt(rest)}`,
  ].join('\n\n');
}

// ---------------------------------------------------------------- file ops
const stats = { created: 0, updated: 0, same: 0 };
const ts = new Date().toISOString().replace(/[:.]/g, '-');
const rendered = [];
function put(dst, data, isRendered) {
  const rel = path.relative(TARGET, dst);
  const buf = Buffer.from(data);
  let status = 'created';
  if (fs.existsSync(dst)) {
    if (Buffer.compare(fs.readFileSync(dst), buf) === 0) { stats.same++; if (isRendered) rendered.push(dst); return; }
    status = 'updated';
    if (!DRY) { const bk = path.join(TARGET, '.claude', '.init-backup', ts, rel); fs.mkdirSync(path.dirname(bk), { recursive: true }); fs.copyFileSync(dst, bk); }
  }
  stats[status]++;
  if (DRY) console.log(`  ${status.padEnd(7)} ${rel}`);
  else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, buf); }
  if (isRendered) rendered.push(dst);
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

function main() {
  if (!fs.existsSync(CONFIG)) { console.error(`✖ Config not found: ${CONFIG}\n  Create it from project.config.example.yml, or run: node init.mjs --scaffold --target "${TARGET}"`); process.exit(1); }
  const cfg = parseYaml(fs.readFileSync(CONFIG, 'utf8'));
  const errors = [];
  for (const k of ['name', 'type', 'stack']) if (!truthy(cfg[k])) errors.push(`missing required key: ${k}`);
  if (!(cfg.branches && cfg.branches.working && cfg.branches.production)) errors.push('missing required keys: branches.working and branches.production');
  const TYPES = Object.keys(JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8')).types);
  if (cfg.type && !TYPES.includes(cfg.type)) errors.push(`type must be ${TYPES.join(' | ')} (got "${cfg.type}")`);
  if (cfg.run_in_docker && !(cfg.docker && cfg.docker.service)) errors.push('run_in_docker is true but docker.service is missing');
  if (errors.length) { console.error('✖ Config problems:\n' + errors.map((e) => '  - ' + e).join('\n')); process.exit(1); }

  const ctx = buildContext(cfg);
  console.log(`${DRY ? '[dry-run] ' : ''}Generating for "${cfg.name}" → ${TARGET}`);

  // 1. core (generic, always overwritten from the template)
  // skills_mode: all (default) installs every skill; focused installs only the ones routed for this type/stack.
  const focused = cfg.skills_mode === 'focused';
  const wanted = (rel) => !focused || ctx.routed_set.has(rel.split(path.sep)[0]);
  if (ctx.unmatched_stack.length) console.warn(`⚠ stack token(s) matched no skill: ${ctx.unmatched_stack.join(', ')} (check spelling, or map them in core/skill-map.json)`);
  for (const sub of ['skills', 'agents', 'rules']) {
    const base = path.join(HERE, 'core', sub);
    for (const f of walk(base)) {
      const rel = path.relative(base, f);
      if (sub === 'skills' && !wanted(rel)) continue;
      put(path.join(TARGET, '.claude', sub, rel), fs.readFileSync(f));
    }
  }
  // 2. templates (rendered with the config)
  const tbase = path.join(HERE, 'templates');
  const needsIntegration = [/skills[\\/](merge-to-dev|merge-to-main|ship)[\\/]/];
  for (const f of walk(tbase)) {
    const rel = path.relative(tbase, f);
    if (!ctx.branches.integration && needsIntegration.some((re) => re.test(rel))) continue;
    put(path.join(TARGET, rel), render(fs.readFileSync(f, 'utf8'), ctx), true);
  }
  // 2b. manifest + settings (settings are merged, never replaced)
  const noIntegration = ['merge-to-dev', 'merge-to-main', 'ship'];
  const skillNames = [...new Set([
    ...fs.readdirSync(path.join(HERE, 'core', 'skills')).filter((n) => wanted(n)),
    ...fs.readdirSync(path.join(tbase, '.claude', 'skills')).filter((n) => ctx.branches.integration || !noIntegration.includes(n)),
  ])].sort();
  const agentNames = fs.readdirSync(path.join(HERE, 'core', 'agents')).map((f) => f.replace(/\.md$/i, '')).sort();
  put(path.join(TARGET, '.claude', 'CONFIGURATION.MANIFEST.JSON'), JSON.stringify({
    name: cfg.name, generatedBy: 'claude-template', templateVersion: TEMPLATE_VERSION, skillsMode: focused ? 'focused' : 'all', type: cfg.type, stack: ctx.stack, branches: ctx.branches,
    runInDocker: Boolean(cfg.run_in_docker), testCommand: ctx.test_cmd_full, skills: skillNames, agents: agentNames,
  }, null, 2) + '\n');

  const stampPath = path.join(TARGET, '.claude', '.template-version');
  const prevVersion = fs.existsSync(stampPath) ? fs.readFileSync(stampPath, 'utf8').trim() : '';
  if (prevVersion && prevVersion !== TEMPLATE_VERSION) console.log(`Template version: ${prevVersion} → ${TEMPLATE_VERSION}`);
  put(stampPath, TEMPLATE_VERSION + '\n');

  const settingsPath = path.join(TARGET, '.claude', 'settings.json');
  let settings = {}; let settingsOk = true;
  if (fs.existsSync(settingsPath)) { try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch { settingsOk = false; console.warn('⚠ .claude/settings.json is not valid JSON; left untouched.'); } }
  if (settingsOk) {
    settings.$schema = settings.$schema || 'https://json.schemastore.org/claude-code-settings.json';
    settings.model = settings.model || cfg.model || 'sonnet';
    settings.permissions = settings.permissions || {};
    const deny = denyRules(cfg, ctx);
    if (deny.length) settings.permissions.deny = [...new Set([...(settings.permissions.deny || []), ...deny])];
    if (cfg.allow_safe_commands !== false) settings.permissions.allow = [...new Set([...(settings.permissions.allow || []), ...allowRules(ctx)])];
    put(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  }

  // 3. mirrors for other agents: .agents/ (Antigravity/Gemini, Codex) and .codex/ (Codex), linked to .claude/
  const mirrors = [];
  if (cfg.agents_mirror !== false) mirrors.push('.agents'); // default ON
  if (cfg.codex_mirror !== false) mirrors.push('.codex');   // default ON
  if (!DRY) {
    for (const dir of mirrors) for (const n of ['rules', 'skills', 'agents']) {
      const link = path.join(TARGET, dir, n);
      if (fs.existsSync(link)) continue;
      fs.mkdirSync(path.dirname(link), { recursive: true });
      const real = path.join(TARGET, '.claude', n);
      try {
        fs.symlinkSync(process.platform === 'win32' ? real : path.join('..', '.claude', n), link, process.platform === 'win32' ? 'junction' : 'dir');
      } catch (e) { console.warn(`⚠ could not create ${dir}/${n} link (${e.code}); set ${dir === '.codex' ? 'codex' : 'agents'}_mirror: false to skip it`); }
    }
  }

  // 3b. keep derived/backup folders out of git (mirrors are recreated by init from the committed config)
  if (!DRY) {
    const want = ['/.claude/.init-backup/'];
    for (const dir of mirrors) want.push(`/${dir}/rules`, `/${dir}/skills`, `/${dir}/agents`);
    const gi = path.join(TARGET, '.gitignore');
    const cur = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : '';
    const add = want.filter((w) => !cur.split(/\r?\n/).some((l) => l.trim() === w));
    if (add.length) {
      fs.writeFileSync(gi, cur + (cur && !cur.endsWith('\n') ? '\n' : '') + `\n# claude-template (generated)\n${add.join('\n')}\n`);
      console.log(`Added to .gitignore: ${add.join(', ')}`);
    }
  }

  // 4. checks
  const problems = [];
  if (!DRY) {
    for (const f of rendered) {
      const left = fs.readFileSync(f, 'utf8').match(/\{\{[^}]*\}\}/g);
      if (left) problems.push(`unresolved placeholder(s) ${[...new Set(left)].join(' ')} in ${path.relative(TARGET, f)}`);
    }
    const forbid = toArr(cfg.forbid).map(String);
    if (forbid.length) {
      const scan = [path.join(TARGET, 'AGENTS.md'), path.join(TARGET, 'CLAUDE.md'), ...(fs.existsSync(path.join(TARGET, '.claude')) ? walk(path.join(TARGET, '.claude')).filter((f) => !f.includes('.init-backup')) : [])];
      for (const f of scan) {
        if (!fs.existsSync(f)) continue;
        const txt = fs.readFileSync(f, 'utf8').toLowerCase();
        for (const w of forbid) if (txt.includes(w.toLowerCase())) problems.push(`forbidden term "${w}" found in ${path.relative(TARGET, f)}`);
      }
    }
    try {
      const gi = fs.readFileSync(path.join(TARGET, '.gitignore'), 'utf8');
      if (/^\/?\.claude\/?\s*$/m.test(gi)) console.warn('⚠ .gitignore ignores .claude/ — remove that line if you want the config shared via git.');
    } catch { /* no .gitignore */ }
  }
  if (missing.size) problems.push(`template uses undefined keys: ${[...missing].join(', ')}`);

  console.log(`${stats.created} created, ${stats.updated} updated, ${stats.same} unchanged.`);
  if (stats.updated && !DRY) console.log(`Previous versions of updated files were saved in .claude/.init-backup/${ts}/ (add it to .gitignore).`);
  if (problems.length) { console.error('✖ Checks failed:\n' + problems.map((p) => '  - ' + p).join('\n')); process.exit(1); }
  console.log('✔ Done. Checks passed (no placeholders left, no forbidden terms).');
}

if (has('--scaffold')) scaffold(); else main();
