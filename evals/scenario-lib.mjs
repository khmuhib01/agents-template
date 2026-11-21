// Scenario harness helpers (no network). A scenario is evals/scenarios/<id>/ with:
//   scenario.json  { title, prompt, type, stack, domains?, tags?, test_command?, graders: [...] }   (test_command: what the orchestrated arm runs to validate, default `node --test`)
//   fixture/       the starting repo
//   hidden/        optional files copied in AFTER the agent finishes (graders may run them)
//   solution/      optional overlay used only by `node evals/scenarios.mjs --check` to prove the graders pass a good answer
// Grader types (all deterministic): exists, absent, contains, not_contains, unchanged, command, regression_test, no_new_urls.
// Every grader has { id, category } where category is one of: correctness, test_quality, security, performance, version, docs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// EVAL_SCENARIOS_DIR points at a folder of private scenarios kept outside this repo (never commit code from another project).
export const SCEN_DIR = process.env.EVAL_SCENARIOS_DIR ? path.resolve(process.env.EVAL_SCENARIOS_DIR) : path.join(HERE, 'scenarios');
export const CATEGORIES = ['correctness', 'test_quality', 'security', 'performance', 'version', 'docs'];
const GENERATED = ['.claude', '.agents', '.codex', '.vscode', 'AGENTS.md', 'CLAUDE.md', 'project.config.yml', '.git', 'node_modules'];

export const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
export const copyDir = (from, to) => { if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true }); };

export function listScenarios(dir = SCEN_DIR) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => fs.existsSync(path.join(dir, n, 'scenario.json'))).sort() : [];
}
export function loadScenario(id, dir = SCEN_DIR) {
  const root = path.join(dir, id);
  return { id, root, ...JSON.parse(fs.readFileSync(path.join(root, 'scenario.json'), 'utf8')) };
}

// Files the agent changed, relative to the fixture (generated template files are ignored).
export function changedFiles(work, fixture) {
  const rel = (base, f) => path.relative(base, f).split(path.sep).join('/');
  const skip = (r) => GENERATED.some((g) => r === g || r.startsWith(g + '/'));
  const now = new Map(walk(work).map((f) => [rel(work, f), f]));
  const was = new Map(walk(fixture).map((f) => [rel(fixture, f), f]));
  const out = [];
  for (const [r, f] of now) if (!skip(r) && (!was.has(r) || !fs.readFileSync(f).equals(fs.readFileSync(was.get(r))))) out.push(r);
  for (const r of was.keys()) if (!now.has(r)) out.push(r);
  return out;
}

const filesOf = (work, p) => { const abs = path.join(work, p); return fs.existsSync(abs) ? (fs.statSync(abs).isDirectory() ? walk(abs) : [abs]) : []; };
const cmdRun = (work, cmd, env = {}) => {
  const [bin, ...rest] = cmd;
  const exe = bin === 'node' ? process.execPath : bin;
  return spawnSync(exe, rest, { cwd: work, encoding: 'utf8', timeout: 60000, env: { ...process.env, ...env } });
};
const hasBin = (b) => b === 'node' || spawnSync(process.platform === 'win32' ? 'where' : 'which', [b], { encoding: 'utf8' }).status === 0;

// Runs every grader. `work` = the directory after the agent ran; `fixture` = the original fixture; `scenario.root/hidden` is copied in first.
export function grade(work, scenario) {
  const fixture = path.join(scenario.root, 'fixture');
  copyDir(path.join(scenario.root, 'hidden'), work);
  const changed = changedFiles(work, fixture);
  const results = [];
  for (const g of scenario.graders) {
    let pass = false; let detail = '';
    const re = g.pattern ? new RegExp(g.pattern, g.flags || '') : null;
    if (g.type === 'exists') pass = filesOf(work, g.path).length > 0;
    else if (g.type === 'absent') pass = filesOf(work, g.path).length === 0;
    else if (g.type === 'contains') pass = re.test(filesOf(work, g.path).map((f) => fs.readFileSync(f, 'utf8')).join('\n'));
    else if (g.type === 'not_contains') { const hit = filesOf(work, g.path).find((f) => re.test(fs.readFileSync(f, 'utf8'))); pass = !hit; if (hit) detail = path.relative(work, hit); }
    else if (g.type === 'unchanged') pass = !changed.includes(g.path);
    else if (g.type === 'command') {
      if (g.optional_binary && !hasBin(g.optional_binary)) { pass = true; detail = `skipped (${g.optional_binary} not installed)`; }
      else { const r = cmdRun(work, g.cmd, g.env); pass = (g.expect === 'fail' ? r.status !== 0 : r.status === 0); detail = pass ? '' : `exit ${r.status}: ${(r.stdout + r.stderr).slice(-300)}`; }
    } else if (g.type === 'regression_test') {
      // The agent's tests must FAIL when the original (buggy) files are restored: proves the new test catches the regression.
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scen-reg-'));
      copyDir(work, tmp);
      for (const f of g.restore) { const src = path.join(fixture, f); if (fs.existsSync(src)) fs.copyFileSync(src, path.join(tmp, f)); }
      const r = cmdRun(tmp, g.cmd, g.env); pass = r.status !== 0; detail = pass ? '' : 'tests still pass with the original code restored';
      fs.rmSync(tmp, { recursive: true, force: true });
    } else if (g.type === 'no_new_urls') {
      const allow = new RegExp(g.allow || '^$'); const bad = [];
      for (const r of changed) { const f = path.join(work, r); if (!fs.existsSync(f)) continue; for (const m of fs.readFileSync(f, 'utf8').matchAll(/https?:\/\/[^\s"'`)>\]]+/g)) if (!allow.test(m[0])) bad.push(m[0]); }
      pass = bad.length === 0; detail = bad.slice(0, 3).join(', ');
    } else detail = `unknown grader type ${g.type}`;
    results.push({ id: g.id, category: g.category, pass, detail });
  }
  return results;
}

// Prepares a temp working copy: fixture, optionally with the generated template (the "skills" arm).
export function prepare(scenario, arm, initPath) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `scen-${scenario.id}-${arm}-`));
  copyDir(path.join(scenario.root, 'fixture'), work);
  spawnSync('git', ['init', '-q'], { cwd: work });
  if (arm === 'skills') {
    const domains = (scenario.domains || []).length ? `domains: [${scenario.domains.join(', ')}]\n` : '';
    fs.writeFileSync(path.join(work, 'project.config.yml'), `name: ${scenario.id}\ntype: ${scenario.type}\nstack: [${(scenario.stack || []).join(', ')}]\n${domains}run_in_docker: false\nbranches: {working: dev, integration: "", production: main}\n`);
    const r = spawnSync(process.execPath, [initPath, '--target', work], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`init failed: ${r.stderr}`);
  }
  if (arm === 'routed') { // cheap-first: orchestrated, but the model comes from model_routing in the project config (EVAL_ROUTING="simple=a,medium=b,complex=c,escalate=d")
    const spec = Object.fromEntries((process.env.EVAL_ROUTING || 'simple=haiku,medium=haiku,complex=sonnet,escalate=sonnet').split(',').map((kv) => kv.split('=')));
    fs.writeFileSync(path.join(work, 'project.config.yml'), `name: ${scenario.id}\ntype: cli\nmodel_routing:\n  enabled: true\n${Object.entries(spec).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n`);
  }
  if (arm === 'orchestrated' || arm === 'routed') { // the driver needs a clean tree with at least one commit; it adds no template files (candidate C = fixture + driver)
    spawnSync('git', ['add', '-A'], { cwd: work });
    spawnSync('git', ['-c', 'user.name=eval', '-c', 'user.email=eval@example.invalid', 'commit', '-q', '-m', 'fixture'], { cwd: work });
  }
  return work;
}

export const ARMS = ['baseline', 'skills', 'orchestrated', 'routed'];

// Validates a scenario's graders without any model: the bare fixture must NOT pass everything, fixture + solution must pass everything.
export function checkScenario(scenario) {
  const problems = [];
  const dirty = prepareCopy(scenario, false);
  const before = grade(dirty, scenario);
  if (before.every((r) => r.pass)) problems.push('graders pass on the untouched fixture (they do not discriminate)');
  fs.rmSync(dirty, { recursive: true, force: true });
  if (!fs.existsSync(path.join(scenario.root, 'solution'))) problems.push('no solution/ overlay to validate the graders against');
  else {
    const good = prepareCopy(scenario, true);
    const after = grade(good, scenario);
    for (const r of after.filter((x) => !x.pass)) problems.push(`grader "${r.id}" fails on the reference solution: ${r.detail}`);
    fs.rmSync(good, { recursive: true, force: true });
  }
  const bad = scenario.graders.filter((g) => !CATEGORIES.includes(g.category) || !g.id);
  if (bad.length) problems.push(`graders without id or valid category: ${bad.map((g) => g.id || g.type).join(', ')}`);
  return problems;
}
function prepareCopy(scenario, withSolution) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `scen-chk-${scenario.id}-`));
  copyDir(path.join(scenario.root, 'fixture'), work);
  if (withSolution) copyDir(path.join(scenario.root, 'solution'), work);
  return work;
}

// Per-category pass rate from graded runs: runs = [{ arm, graders: [{category, pass}] }].
export function categoryRates(runs) {
  const out = {};
  for (const r of runs) for (const g of r.graders) { const k = `${r.arm}|${g.category}`; out[k] = out[k] || { arm: r.arm, category: g.category, pass: 0, total: 0 }; out[k].total++; if (g.pass) out[k].pass++; }
  return Object.values(out);
}
