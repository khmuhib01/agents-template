#!/usr/bin/env node
// claude-template init — reads project.config.yml and generates AGENTS.md, CLAUDE.md and .claude/ for a project.
// Zero dependencies. Usage:
//   node init.mjs [--target DIR] [--config FILE] [--dry-run]   generate / update (safe to re-run)
//   node init.mjs --check [--target DIR]                       exit 1 if generated files are out of date (CI); writes nothing
//   node init.mjs --force                                      overwrite files you edited by hand (a backup is made)
//   node init.mjs --scaffold [--target DIR]                    write a draft project.config.yml from detected stack
import fs from 'node:fs';
import crypto from 'node:crypto';
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
const CHECK = has('--check');
const FORCE = has('--force');
const DRY = has('--dry-run') || CHECK;

import { parseYaml } from './lib/yaml.mjs';
import { render, missing, truthy } from './lib/render.mjs';
import { scaffold } from './lib/scaffold.mjs';
import { focusSkills, shipsWithSkill } from './lib/routing.mjs';

// ---------------------------------------------------------------- context
const toArr = (v) => (Array.isArray(v) ? v.filter((x) => x !== '') : v === '' || v === undefined ? [] : [v]);
const bullets = (a) => a.map((x) => `- ${x}`).join('\n');
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

function buildContext(c) {
  const d = { ...c };
  d.stack = toArr(c.stack);
  d.stack_list = d.stack.join(', ');
  const rawPk = c.packages && typeof c.packages === 'object' && !Array.isArray(c.packages) ? c.packages : {};
  d.packages = Object.entries(rawPk).map(([key, p]) => ({ key, path: String((p && p.path) || '').replace(/\\/g, '/').replace(/\/+$/, ''), stack: toArr(p && p.stack).map(String), type: String((p && p.type) || c.type), test_command: String((p && p.test_command) || ''), notes: toArr(p && p.notes).map(String) }));
  d.packages = d.packages.filter((p) => { const ok = !p.path || fs.existsSync(path.join(TARGET, p.path)); if (!ok) console.warn(`⚠ packages.${p.key}: folder "${p.path}" does not exist; package ignored`); return ok; });
  d.stack = [...new Set([...d.stack, ...d.packages.flatMap((p) => p.stack)])]; // routing and deny rules see every package's stack
  d.packages_list = bullets(d.packages.map((p) => `\`${p.path}/\` (${p.stack.join(', ') || 'no stack'})${p.test_command ? `, tests: \`${p.test_command}\`` : ''}`));
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
  d.domains = toArr(c.domains).map(String);
  d.skill_routing = skillRouting(d, c.skills_mode !== 'all');
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

// Hooks: scripts live in core/hooks and are copied to .claude/hooks; project values go in .claude/hooks/config.json.
const HOOK_SCRIPTS = ['guard-bash', 'guard-secrets', 'guard-read', 'context-nudge', 'session-context', 'format'];
const STATUSLINE_CMD = 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/statusline.mjs"';
const numOpt = (v, dflt) => (v === undefined || v === '' ? dflt : Number(v));
const hookCommand = (script) => `node "$CLAUDE_PROJECT_DIR/.claude/hooks/${script}.mjs"`;
function desiredHooks(cfg) {
  if (cfg.hooks === false) return [];
  const list = [{ event: 'PreToolUse', matcher: 'Bash', script: 'guard-bash' }];
  if (cfg.protect_secrets !== false) list.push({ event: 'PreToolUse', matcher: 'Write|Edit|MultiEdit|NotebookEdit', script: 'guard-secrets' });
  if (numOpt(cfg.big_file_kb, 100) > 0) list.push({ event: 'PreToolUse', matcher: 'Read', script: 'guard-read' });
  if (numOpt(cfg.context_nudge_kb, 400) > 0) list.push({ event: 'UserPromptSubmit', script: 'context-nudge' });
  if (cfg.session_context === true) list.push({ event: 'SessionStart', matcher: 'startup|clear', script: 'session-context' });
  if (truthy(cfg.format_command)) list.push({ event: 'PostToolUse', matcher: 'Write|Edit|MultiEdit', script: 'format' });
  return list;
}
function hooksConfig(cfg) {
  const b = cfg.branches || {};
  return {
    protectedBranches: [...new Set([b.production, b.integration].filter(Boolean).map(String))],
    blockAttribution: !cfg.commit_attribution,
    localOnly: toArr(cfg.local_only).map(String),
    formatCommand: truthy(cfg.format_command) ? String(cfg.format_command) : '',
    bigFileKb: numOpt(cfg.big_file_kb, 100),
    contextNudgeKb: numOpt(cfg.context_nudge_kb, 400),
  };
}
// statusline: opt-in, never replaces a status line you configured yourself.
function mergeStatusLine(settings, on) {
  const ours = settings.statusLine && String(settings.statusLine.command || '').includes('.claude/hooks/statusline.mjs');
  if (on) {
    if (!settings.statusLine || ours) settings.statusLine = { type: 'command', command: STATUSLINE_CMD };
    else console.warn('⚠ statusline: true, but settings.json already has a different statusLine; left unchanged.');
  } else if (ours) delete settings.statusLine;
}
// MCP: mcp_allow limits which .mcp.json servers are enabled; mcp_deny blocks a server's tools. Both are additive.
function mergeMcp(settings, cfg) {
  const allow = toArr(cfg.mcp_allow).map(String);
  const deny = toArr(cfg.mcp_deny).map(String);
  if (allow.length) {
    settings.enabledMcpjsonServers = [...new Set([...(settings.enabledMcpjsonServers || []), ...allow])];
    if (settings.enableAllProjectMcpServers === undefined) settings.enableAllProjectMcpServers = false;
  }
  if (deny.length) {
    settings.permissions = settings.permissions || {};
    settings.permissions.deny = [...new Set([...(settings.permissions.deny || []), ...deny.map((n) => `mcp__${n}`)])];
  }
}
// Adds our hook entries, drops our stale ones, and leaves every other hook untouched.
function mergeHooks(settings, desired) {
  const hooks = settings.hooks && typeof settings.hooks === 'object' ? settings.hooks : {};
  const ours = (cmd) => HOOK_SCRIPTS.some((s) => String(cmd || '').includes(`.claude/hooks/${s}.mjs`));
  const want = new Set(desired.map((d) => hookCommand(d.script)));
  for (const ev of Object.keys(hooks)) {
    if (!Array.isArray(hooks[ev])) continue;
    hooks[ev] = hooks[ev]
      .map((g) => (Array.isArray(g.hooks) ? { ...g, hooks: g.hooks.filter((h) => !(ours(h.command) && !want.has(h.command))) } : g))
      .filter((g) => !Array.isArray(g.hooks) || g.hooks.length);
    if (!hooks[ev].length) delete hooks[ev];
  }
  for (const d of desired) {
    const cmd = hookCommand(d.script);
    const list = (hooks[d.event] = Array.isArray(hooks[d.event]) ? hooks[d.event] : []);
    if (!list.some((g) => Array.isArray(g.hooks) && g.hooks.some((h) => h.command === cmd))) list.push({ matcher: d.matcher, hooks: [{ type: 'command', command: cmd }] });
  }
  if (Object.keys(hooks).length) settings.hooks = hooks; else delete settings.hooks;
}

// model_profile: which model each agent runs on. 'balanced' keeps the model written in the agent file.
const MODEL_PROFILES = {
  economy: { main: 'sonnet', agents: { '*': 'sonnet', 'git-manager': 'haiku' } },
  balanced: { main: 'sonnet', agents: {} },
  quality: { main: 'opus', agents: { architect: 'opus', planner: 'opus', debugger: 'opus', 'security-reviewer': 'opus' } },
};
function applyModelProfile(name, text, profile) {
  const rule = MODEL_PROFILES[profile].agents;
  const model = rule[name] || rule['*'];
  if (!model) return text;
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const fmEnd = text.indexOf(nl + '---', 3);
  if (!text.startsWith('---') || fmEnd < 0) return text;
  let fm = text.slice(0, fmEnd);
  fm = /^model:.*$/m.test(fm) ? fm.replace(/^model:.*$/m, `model: ${model}`) : fm + nl + `model: ${model}`;
  return fm + text.slice(fmEnd);
}

// Typos in config keys are otherwise silently ignored. The JSON schema is the list of known keys.
function warnUnknownKeys(cfg) {
  let known;
  try { known = Object.keys(JSON.parse(fs.readFileSync(path.join(HERE, 'project.config.schema.json'), 'utf8')).properties); } catch { return; }
  const dist = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  for (const k of Object.keys(cfg).filter((x) => !known.includes(x))) {
    const near = known.map((n) => [n, dist(k, n)]).sort((x, y) => x[1] - y[1])[0];
    console.warn(`⚠ unknown config key "${k}" is ignored${near && near[1] <= 3 ? ` (did you mean "${near[0]}"?)` : ''}`);
  }
}

const installedSkills = () => new Set([...fs.readdirSync(path.join(HERE, 'core', 'skills')), ...fs.readdirSync(path.join(HERE, 'templates', '.claude', 'skills'))]);

function skillRouting(d, focused) {
  const map = JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8'));
  const installed = new Set([...fs.readdirSync(path.join(HERE, 'core', 'skills')), ...fs.readdirSync(path.join(HERE, 'templates', '.claude', 'skills'))]);
  const { focus, unmatched, unmatchedDomains } = focusSkills(map, installed, d.type, d.stack, d.domains);
  d.unmatched_stack = unmatched;
  d.unmatched_domains = unmatchedDomains;
  const always = map.always.filter((s) => installed.has(s));
  const focusList = [...focus].filter((s) => installed.has(s) && !always.includes(s));
  d.routed_set = new Set([...always, ...focusList]);
  const rest = [...installed].filter((s) => !focus.has(s) && !always.includes(s)).sort();
  const fmt = (a) => a.map((s) => `\`${s}\``).join(', ');
  const primary = `**Primary for this project** (${d.type}; ${d.stack_list || 'no stack set'}): ${focusList.length ? fmt(focusList) : '_none matched — set `stack` in project.config.yml_'}`;
  // focused: only routed skills are installed and the harness already lists every installed skill, so repeating them (or naming skills that are not installed) only costs tokens.
  if (focused) return primary;
  return [
    primary,
    `**Always useful:** ${fmt(always)}`,
    `**Also installed, use only when the task needs them:** ${fmt(rest)}`,
  ].join('\n\n');
}

// ---------------------------------------------------------------- file ops
const stats = { created: 0, updated: 0, same: 0 };
const ts = new Date().toISOString().replace(/[:.]/g, '-');
const rendered = [];
// Hand-edit protection: init records a hash of every generated file in HASH_FILE. If a file no longer matches the hash
// init wrote last time, you edited it: keep your version (the new template version is saved next to the backups) unless --force.
const HASH_FILE = '.claude/.template-hashes.json';
const UNTRACKED = new Set(['.claude/settings.json', '.claude/CONFIGURATION.MANIFEST.JSON', '.claude/.template-version', '.claude/hooks/config.json', HASH_FILE]);
const digest = (b) => crypto.createHash('sha256').update(Buffer.from(b).toString('utf8').replace(/\r/g, '')).digest('hex');
let prevHashes = {};
const newHashes = {};
const kept = [];
function put(dst, data, isRendered) {
  const rel = path.relative(TARGET, dst);
  const key = rel.split(path.sep).join('/');
  const track = !UNTRACKED.has(key);
  const buf = Buffer.from(data);
  const h = digest(buf);
  let status = 'created';
  if (fs.existsSync(dst)) {
    const cur = fs.readFileSync(dst);
    if (Buffer.compare(cur, buf) === 0 || digest(cur) === h) { stats.same++; if (track) newHashes[key] = h; if (isRendered) rendered.push(dst); return; }
    if (track && !FORCE && prevHashes[key] && digest(cur) !== prevHashes[key]) {
      kept.push(key);
      newHashes[key] = prevHashes[key];
      if (!DRY) { const tp = path.join(TARGET, '.claude', '.init-backup', ts, rel + '.template'); fs.mkdirSync(path.dirname(tp), { recursive: true }); fs.writeFileSync(tp, buf); }
      if (isRendered) rendered.push(dst);
      return;
    }
    status = 'updated';
    if (!DRY) { const bk = path.join(TARGET, '.claude', '.init-backup', ts, rel); fs.mkdirSync(path.dirname(bk), { recursive: true }); fs.copyFileSync(dst, bk); }
  }
  stats[status]++;
  if (track) newHashes[key] = h;
  if (DRY) console.log(`  ${status.padEnd(7)} ${rel}`);
  else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, buf); }
  if (isRendered) rendered.push(dst);
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

function main() {
  if (!fs.existsSync(CONFIG)) { console.error(`✖ Config not found: ${CONFIG}\n  Create it from project.config.example.yml, or run: node init.mjs --scaffold --target "${TARGET}"`); process.exit(1); }
  let cfg;
  try { cfg = parseYaml(fs.readFileSync(CONFIG, 'utf8')); } catch (e) { console.error(`✖ ${path.basename(CONFIG)}: ${e.message}`); process.exit(1); }
  const errors = [];
  for (const k of ['name', 'type', 'stack']) if (!truthy(cfg[k])) errors.push(`missing required key: ${k}`);
  if (!(cfg.branches && cfg.branches.working && cfg.branches.production)) errors.push('missing required keys: branches.working and branches.production');
  const TYPES = Object.keys(JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8')).types);
  if (cfg.type && !TYPES.includes(cfg.type)) errors.push(`type must be ${TYPES.join(' | ')} (got "${cfg.type}")`);
  if (cfg.model_profile !== undefined && !Object.keys(MODEL_PROFILES).includes(String(cfg.model_profile))) errors.push(`model_profile must be ${Object.keys(MODEL_PROFILES).join(' | ')} (got "${cfg.model_profile}")`);
  for (const k of ['mcp_allow', 'mcp_deny']) for (const n of toArr(cfg[k])) if (!/^[\w.-]+$/.test(String(n))) errors.push(`${k}: "${n}" is not a valid MCP server name (letters, digits, _ . -)`);
  for (const k of ['token_budget', 'big_file_kb', 'context_nudge_kb']) if (cfg[k] !== undefined && cfg[k] !== '' && !(Number.isFinite(Number(cfg[k])) && Number(cfg[k]) >= 0)) errors.push(`${k} must be a number >= 0 (got "${cfg[k]}")`);
  if (cfg.packages !== undefined && cfg.packages !== '' && (typeof cfg.packages !== 'object' || Array.isArray(cfg.packages))) errors.push('packages must be a map of name -> {path, stack, ...} (see project.config.example.yml)');
  else for (const [key, p] of Object.entries(cfg.packages || {})) {
    const pp = String((p && p.path) || '').replace(/\\/g, '/');
    if (!pp) errors.push(`packages.${key}.path is required`);
    else if (path.isAbsolute(pp) || /^[a-zA-Z]:/.test(pp) || pp.split('/').includes('..') || /^\.?\/?\.claude(\/|$)/.test(pp)) errors.push(`packages.${key}.path must be a relative folder inside the project (got "${pp}")`);
    if (p && p.type && !TYPES.includes(p.type)) errors.push(`packages.${key}.type must be ${TYPES.join(' | ')} (got "${p.type}")`);
  }
  if (cfg.run_in_docker && !(cfg.docker && cfg.docker.service)) errors.push('run_in_docker is true but docker.service is missing');
  if (errors.length) { console.error('✖ Config problems:\n' + errors.map((e) => '  - ' + e).join('\n')); process.exit(1); }

  warnUnknownKeys(cfg);
  try { prevHashes = JSON.parse(fs.readFileSync(path.join(TARGET, HASH_FILE), 'utf8')); } catch { prevHashes = {}; }
  const ctx = buildContext(cfg);
  console.log(`${DRY ? '[dry-run] ' : ''}Generating for "${cfg.name}" → ${TARGET}`);

  // 1. core (generic, always overwritten from the template)
  // skills_mode: focused (default) installs only the skills routed for this type/stack; all installs every skill.
  const focused = cfg.skills_mode !== 'all';
  const profile = String(cfg.model_profile || 'balanced');
  const wanted = (rel) => !focused || ctx.routed_set.has(rel.split(path.sep)[0]);
  if (ctx.unmatched_stack.length) {
    const doms = Object.keys(JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8')).domains || {});
    const asDomain = ctx.unmatched_stack.filter((x) => doms.includes(x));
    console.warn(`⚠ stack token(s) matched no skill: ${ctx.unmatched_stack.join(', ')} (check spelling, or map them in core/skill-map.json)${asDomain.length ? `; ${asDomain.join(', ')} ${asDomain.length > 1 ? 'are' : 'is a'} domain${asDomain.length > 1 ? 's' : ''}: put ${asDomain.length > 1 ? 'them' : 'it'} under \`domains\` instead of \`stack\`` : ''}`);
  }
  if (ctx.unmatched_domains.length) console.warn(`⚠ domain(s) matched no skill: ${ctx.unmatched_domains.join(', ')} (see "domains" in core/skill-map.json)`);
  if (focused && cfg.type === 'mobile') {
    // mobile-release and mobile-quality come in through the platform skills (flutter, react-native, swift, android-kotlin), not through `type`.
    const skillMap = JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8'));
    const platform = Object.entries(skillMap.deps || {}).filter(([, v]) => v.includes('mobile-release')).map(([k]) => k);
    if (platform.length && !platform.some((s) => ctx.routed_set.has(s))) console.warn('⚠ type is mobile but no platform stack token matched (for example android, compose, ios, swift, flutter, expo, reactnative): mobile-release and mobile-quality are not installed. Add a platform token to `stack` to get all four mobile skills.');
  }
  for (const sub of ['skills', 'agents', 'rules']) {
    const base = path.join(HERE, 'core', sub);
    for (const f of walk(base)) {
      const rel = path.relative(base, f);
      if (sub === 'skills' && (!wanted(rel) || !shipsWithSkill(rel))) continue; // maintainer-only folders (evals/, examples/) are never installed
      const buf = sub === 'agents' ? Buffer.from(applyModelProfile(rel.replace(/.md$/i, ''), fs.readFileSync(f, 'utf8'), profile)) : fs.readFileSync(f);
      put(path.join(TARGET, '.claude', sub, rel), buf);
    }
  }
  // 1b. hooks (only the scripts this config needs, plus their shared lib and config)
  const hookList = desiredHooks(cfg);
  if (hookList.length || cfg.statusline === true) {
    const hbase = path.join(HERE, 'core', 'hooks');
    const names = new Set(['lib', ...hookList.map((h) => h.script), ...(cfg.statusline === true ? ['statusline'] : [])]);
    for (const n of names) put(path.join(TARGET, '.claude', 'hooks', `${n}.mjs`), fs.readFileSync(path.join(hbase, `${n}.mjs`)));
    put(path.join(TARGET, '.claude', 'hooks', 'config.json'), JSON.stringify(hooksConfig(cfg), null, 2) + '\n');
  }
  // 1c. monorepo: a small CLAUDE.md inside each package folder (Claude Code reads nested CLAUDE.md files when it works there)
  if (ctx.packages.length) {
    const map = JSON.parse(fs.readFileSync(path.join(HERE, 'core', 'skill-map.json'), 'utf8'));
    const installed = installedSkills();
    for (const p of ctx.packages) {
      const dir = path.join(TARGET, p.path);
      const mine = [...focusSkills(map, installed, 'library', p.stack).focus].filter((x) => !map.always.includes(x)); // stack-specific only; 'library' adds no type skills
      const prefix = ctx.exec_prefix ? ctx.exec_prefix + ' ' : '';
      const lines = [
        `# ${p.key} (\`${p.path}/\`)`, '',
        'Package context; the root CLAUDE.md and .claude/ rules still apply. Generated from project.config.yml.', '',
        `Type ${p.type}; stack: ${p.stack.join(', ') || 'see root'}.`,
        ...(p.test_command ? [`Tests: \`${prefix}${p.test_command}\``] : []),
        ...(mine.length ? [`Skills for this package: ${mine.map((x) => '\`' + x + '\`').join(', ')}.`] : []),
        ...(p.notes.length ? ['', ...p.notes.map((n) => '- ' + n)] : []),
      ];
      put(path.join(dir, 'CLAUDE.md'), lines.join('\n') + '\n');
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
    runInDocker: Boolean(cfg.run_in_docker), testCommand: ctx.test_cmd_full, skills: skillNames, agents: agentNames, hooks: hookList.map((h) => h.script), packages: ctx.packages.map((p) => p.path),
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
    settings.model = settings.model || cfg.model || MODEL_PROFILES[profile].main;
    settings.permissions = settings.permissions || {};
    const deny = denyRules(cfg, ctx);
    if (deny.length) settings.permissions.deny = [...new Set([...(settings.permissions.deny || []), ...deny])];
    if (cfg.allow_safe_commands !== false) settings.permissions.allow = [...new Set([...(settings.permissions.allow || []), ...allowRules(ctx)])];
    mergeHooks(settings, hookList);
    mergeStatusLine(settings, cfg.statusline === true);
    mergeMcp(settings, cfg);
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

  // Blank out comments and trailing commas (same length, so offsets still match the raw text) to read JSONC settings files.
  function blankJsonc(raw) {
    let out = ''; let i = 0;
    while (i < raw.length) {
      const c = raw[i]; const n = raw[i + 1];
      if (c === '"') {
        let j = i + 1;
        while (j < raw.length && raw[j] !== '"') j += raw[j] === '\\' ? 2 : 1;
        out += raw.slice(i, j + 1); i = j + 1;
      } else if (c === '/' && n === '/') {
        while (i < raw.length && raw[i] !== '\n' && raw[i] !== '\r') { out += ' '; i++; }
      } else if (c === '/' && n === '*') {
        const end = raw.indexOf('*/', i + 2); const stop = end === -1 ? raw.length : end + 2;
        out += raw.slice(i, stop).replace(/[^\r\n]/g, ' '); i = stop;
      } else { out += c; i++; }
    }
    return out.replace(/,(\s*[}\]])/g, (_, t) => ' ' + t);
  }

  function applyVscodeSettings() {
    const WANT = { 'search.useIgnoreFiles': false, 'search.useParentIgnoreFiles': false };
    const EXCLUDE_KEY = 'search.exclude'; const EXCLUDE_SUB = '**/.claude/.init-backup';
    const rel = '.vscode/settings.json';
    const sp = path.join(TARGET, '.vscode', 'settings.json');
    const manual = `Set ${Object.keys(WANT).join(' and ')} to false (and exclude **/.claude/.init-backup from search) in your VS Code settings yourself.`;
    // 0 = ignored, 1 = not ignored, 128 = not a git repository (nothing can be committed, so it is safe to write).
    let code = 0;
    try { execSync(`git check-ignore -q ${rel}`, { cwd: TARGET, stdio: 'ignore' }); } catch (e) { code = e.status ?? 1; }
    if (code === 1) return { status: 'skipped', message: `⚠ ${rel} not written: .vscode/ is not git-ignored, so these settings would be committed and change teammates' editors. Ignore .vscode/ or ${manual}  (vscode_settings: false silences this.)` };

    const exists = fs.existsSync(sp);
    const raw = exists ? fs.readFileSync(sp, 'utf8').replace(/^﻿/, '') : '';
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    let cur = {};
    if (exists && raw.trim()) {
      try { cur = JSON.parse(blankJsonc(raw)); } catch { return { status: 'skipped', message: `⚠ ${rel} could not be parsed; left untouched. ${manual}` }; }
      if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return { status: 'skipped', message: `⚠ ${rel} is not a JSON object; left untouched. ${manual}` };
    }
    const addTop = Object.entries(WANT).filter(([k]) => !(k in cur));
    const ex = cur[EXCLUDE_KEY];
    const exObject = ex && typeof ex === 'object' && !Array.isArray(ex);
    const needExcludeKey = !(EXCLUDE_KEY in cur);
    const needExcludeSub = exObject && !(EXCLUDE_SUB in ex);
    if (!addTop.length && !needExcludeKey && !needExcludeSub) return { status: 'unchanged' };

    let strict = true;
    try { JSON.parse(raw || '{}'); } catch { strict = false; }
    let text; let note = '';
    if (!exists || !raw.trim() || strict) {
      const next = { ...cur };
      for (const [k, v] of addTop) next[k] = v;
      if (needExcludeKey) next[EXCLUDE_KEY] = { [EXCLUDE_SUB]: true };
      else if (needExcludeSub) next[EXCLUDE_KEY] = { ...ex, [EXCLUDE_SUB]: true };
      const indent = (raw.match(/^([ \t]+)"/m) || [, '  '])[1];
      text = JSON.stringify(next, null, indent).replace(/\n/g, eol) + eol;
    } else {
      // The file has comments or trailing commas: insert only missing top-level keys as text so nothing else is touched.
      const entries = [...addTop.map(([k, v]) => `"${k}": ${v}`)];
      if (needExcludeKey) entries.push(`"${EXCLUDE_KEY}": { "${EXCLUDE_SUB}": true }`);
      if (needExcludeSub) note = ` ("${EXCLUDE_KEY}" has comments, so add "${EXCLUDE_SUB}": true to it yourself)`;
      if (!entries.length) return { status: 'skipped', message: `⚠ ${rel} contains comments; add "${EXCLUDE_SUB}": true to "${EXCLUDE_KEY}" yourself.` };
      const blank = blankJsonc(raw);
      const close = blank.lastIndexOf('}');
      let p = close - 1; while (p >= 0 && /\s/.test(blank[p])) p--;
      const indent = (raw.match(/^([ \t]+)"/m) || [, '  '])[1];
      const body = entries.map((e) => indent + e).join(',' + eol);
      const comma = blank[p] === '{' || blank[p] === ',' ? '' : ',';
      text = raw.slice(0, p + 1) + comma + eol + body + raw.slice(p + 1);
    }
    if (!DRY) { fs.mkdirSync(path.dirname(sp), { recursive: true }); fs.writeFileSync(sp, text); }
    return { status: exists ? 'updated' : 'created', ignoreNote: note, message: `${exists ? 'Updated' : 'Created'} ${rel}: search includes git-ignored files so the "@" picker can find them. Reload Window to apply.${note}` };
  }

  // 3c. VS Code "@" picker: it is a file search that obeys .gitignore, so git-ignored generated files (.claude/agents, ...) are
  // invisible. Add the minimal workspace settings that fix it. Only missing keys are added; user values are never changed.
  const vscode = cfg.vscode_settings === false ? { status: 'off' } : applyVscodeSettings();
  if (vscode.status === 'created') stats.created++;
  else if (vscode.status === 'updated') stats.updated++;
  else if (vscode.status === 'unchanged') stats.same++;
  if (vscode.message) console.log(vscode.message);

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
      if (/^\/?\.claude\/?\s*$/m.test(gi)) {
        const fix = ['created', 'updated', 'unchanged'].includes(vscode.status)
          ? 'init wrote search.useIgnoreFiles=false in .vscode/settings.json (Reload Window to apply)'
          : 'set search.useIgnoreFiles=false in your VS Code settings (init did not write .vscode/settings.json)';
        console.warn(`⚠ .gitignore ignores .claude/ — remove that line if you want the config shared via git.\n  The "@" picker will not list ignored files; ${fix}.`);
      }
    } catch { /* no .gitignore */ }
  }
  if (missing.size) problems.push(`template uses undefined keys: ${[...missing].join(', ')}`);

  console.log(`${stats.created} created, ${stats.updated} updated, ${stats.same} unchanged.`);
  console.log('"@" only mentions files. To run an agent, name it in chat or use /agents.');
  if (stats.updated && !DRY) console.log(`Previous versions of updated files were saved in .claude/.init-backup/${ts}/ (add it to .gitignore).`);
  if (kept.length) console.log(`Kept ${kept.length} file(s) you edited by hand (the template version differs): ${kept.join(', ')}\n  Merge from .claude/.init-backup/${ts}/<file>.template, or re-run with --force to overwrite them (a backup is made).`);
  if (problems.length) { console.error('✖ Checks failed:\n' + problems.map((p) => '  - ' + p).join('\n')); process.exit(1); }
  if (CHECK) {
    if (stats.created || stats.updated) { console.error(`✖ ${stats.created + stats.updated} generated file(s) are out of date. Run: node ${path.join(HERE, 'init.mjs')} --target "${TARGET}"`); process.exit(1); }
    console.log('✔ Generated files are in sync with project.config.yml and the template.');
    return;
  }
  if (!DRY) {
    const sorted = Object.fromEntries(Object.keys(newHashes).sort().map((k) => [k, newHashes[k]]));
    const hp = path.join(TARGET, HASH_FILE);
    const text = JSON.stringify(sorted, null, 2) + '\n';
    if (!fs.existsSync(hp) || fs.readFileSync(hp, 'utf8') !== text) { fs.mkdirSync(path.dirname(hp), { recursive: true }); fs.writeFileSync(hp, text); }
  }
  // Always-loaded context: what every session pays before the first prompt. Descriptions of model-invocable skills count;
  // manual-only skills (disable-model-invocation: true) are not listed to the model, so they cost nothing.
  const tplSkills = new Set(fs.readdirSync(path.join(tbase, '.claude', 'skills')));
  const frontmatter = (f) => { const m = fs.readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/); return m ? m[1] : ''; };
  const skillMeta = (name) => {
    for (const dir of [path.join(HERE, 'core', 'skills'), path.join(tbase, '.claude', 'skills')]) {
      const f = path.join(dir, name, 'SKILL.md');
      if (!fs.existsSync(f)) continue;
      const fm = frontmatter(f);
      const d = fm.match(/^description:\s*(.*)$/m);
      return { manual: /^disable-model-invocation:\s*true/m.test(fm), chars: name.length + (d ? d[1].length : 0) };
    }
    return { manual: true, chars: 0 };
  };
  const descTokens = (names) => Math.round(names.reduce((n, name) => { const m = skillMeta(name); return n + (m.manual ? 0 : m.chars); }, 0) / 4);
  const nowTok = descTokens(skillNames);
  const invocable = skillNames.filter((n) => !skillMeta(n).manual).length;
  console.log(`Skills: ${skillNames.length} installed, ${invocable} model-invocable (~${nowTok} tokens of descriptions in every session).`);
  if (!focused) {
    const fNames = skillNames.filter((n) => ctx.routed_set.has(n) || tplSkills.has(n));
    const fTok = descTokens(fNames);
    if (fNames.length < skillNames.length) console.log(`  skills_mode: focused would install ${fNames.length} (~${fTok} tokens, saves ~${nowTok - fTok}).`);
  }
  if (!DRY) {
    const claudeDir = path.join(TARGET, '.claude');
    const size = (f) => (fs.existsSync(f) ? fs.statSync(f).size : 0);
    const mdIn = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.md')).map((f) => path.join(d, f)) : []);
    const instrTok = Math.round([path.join(TARGET, 'CLAUDE.md'), path.join(claudeDir, 'CLAUDE.md')].reduce((n, f) => n + size(f), 0) / 4);
    const alwaysRule = (f) => !/^paths:/m.test(frontmatter(f)); // rules with a paths: frontmatter load only when matching files are touched
    const rulesTok = Math.round(mdIn(path.join(claudeDir, 'rules')).filter(alwaysRule).reduce((n, f) => n + size(f), 0) / 4);
    const skillsDir = path.join(claudeDir, 'skills');
    const skillsTok = descTokens(fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir) : []);
    const agentsTok = Math.round(mdIn(path.join(claudeDir, 'agents')).reduce((n, f) => { const d = frontmatter(f).match(/^description:\s*(.*)$/m); return n + path.basename(f).length + (d ? d[1].length : 0); }, 0) / 4);
    const total = instrTok + rulesTok + skillsTok + agentsTok;
    console.log(`Always-loaded context: ~${total} tokens (instructions ~${instrTok}, rules ~${rulesTok}, skill descriptions ~${skillsTok}, agent descriptions ~${agentsTok}).`);
    const budget = numOpt(cfg.token_budget, 0);
    if (budget > 0 && total > budget) console.warn(`⚠ always-loaded context (~${total} tokens) is over token_budget (${budget}). Try skills_mode: focused, fewer rules, or shorter notes.`);
  }
  console.log('✔ Done. Checks passed (no placeholders left, no forbidden terms).');
}

if (has('--scaffold')) scaffold({ target: TARGET, dry: DRY, here: HERE }); else main();
