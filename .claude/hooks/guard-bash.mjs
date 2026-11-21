// PreToolUse(Bash): blocks risky git/gh commands. Settings come from ./config.json.
import { spawnSync } from 'node:child_process';
import { readInput, loadConfig, block, ask, run } from './lib.mjs';

// Splits on ; | & and newlines that are outside quotes.
function splitSegments(cmd) {
  const out = []; let cur = ''; let q = '';
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (q) {
      cur += ch;
      if (ch === '\\' && q === '"') { cur += cmd[++i] ?? ''; continue; }
      if (ch === q) q = '';
      continue;
    }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '\\') { cur += ch + (cmd[++i] ?? ''); continue; }
    if (ch === ';' || ch === '\n' || ch === '|' || ch === '&') { out.push(cur); cur = ''; while (cmd[i + 1] === '|' || cmd[i + 1] === '&') i++; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/^[({]+\s*/, '')).filter(Boolean);
}

function tokenize(seg) {
  const t = []; let cur = ''; let q = ''; let has = false;
  for (const ch of seg) {
    if (q) { if (ch === q) q = ''; else cur += ch; continue; }
    if (ch === '"' || ch === "'") { q = ch; has = true; continue; }
    if (/\s/.test(ch)) { if (cur || has) { t.push(cur); cur = ''; has = false; } continue; }
    cur += ch;
  }
  if (cur || has) t.push(cur);
  return t;
}

// -> { sub, args, dir } for `git [global opts] <sub> ...`, otherwise null.
function parseGit(tokens) {
  let i = 0;
  while (i < tokens.length && /^\w+=/.test(tokens[i])) i++;
  if (!/(^|[\\/])git(\.exe)?$/.test(tokens[i] || '')) return null;
  i++;
  let dir = '';
  while (i < tokens.length && tokens[i].startsWith('-')) {
    if (tokens[i] === '-C') { dir = tokens[i + 1] || ''; i += 2; }
    else if (['-c', '--git-dir', '--work-tree', '--namespace'].includes(tokens[i])) i += 2;
    else i++;
  }
  return tokens[i] ? { sub: tokens[i], args: tokens.slice(i + 1), dir } : null;
}

run(() => {
  const input = readInput();
  const cmd = String((input.tool_input || {}).command || '');
  if (!/\bgit\b|\bgh\b/.test(cmd)) process.exit(0);
  const cfg = loadConfig();
  const protectedBranches = cfg.protectedBranches || [];
  const cwd = input.cwd || process.cwd();
  const branchCache = new Map();
  const currentBranch = (dir) => {
    const key = dir || '';
    if (!branchCache.has(key)) {
      const r = spawnSync('git', [...(dir ? ['-C', dir] : []), 'symbolic-ref', '--short', 'HEAD'], { cwd, encoding: 'utf8' });
      branchCache.set(key, r.status === 0 ? r.stdout.trim() : '');
    }
    return branchCache.get(key);
  };
  const isProtected = (b) => Boolean(b) && protectedBranches.includes(b);

  const asks = [];
  let sawCommit = false;
  for (const seg of splitSegments(cmd)) {
    const tokens = tokenize(seg);
    if (tokens[0] === 'gh' && tokens[1] === 'pr' && ['create', 'edit'].includes(tokens[2])) sawCommit = true;
    const g = parseGit(tokens);
    if (!g) continue;
    const flags = g.args.filter((a) => a.startsWith('-'));
    const positional = g.args.filter((a) => !a.startsWith('-'));
    const branch = currentBranch(g.dir);

    if (g.sub === 'commit') {
      sawCommit = true;
      if (flags.includes('--no-verify') || flags.some((f) => /^-[a-zA-Z]*n[a-zA-Z]*$/.test(f))) block('git commit --no-verify (skipping hooks) is not allowed.');
      if (isProtected(branch)) block(`direct commits to protected branch "${branch}" are not allowed. Switch to your working branch.`);
    }
    if (g.sub === 'push') {
      if (flags.includes('--no-verify')) block('git push --no-verify (skipping hooks) is not allowed.');
      if (flags.some((f) => f === '--force' || f.startsWith('--force-with-lease') || f === '--force-if-includes' || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(f)) || positional.slice(1).some((r) => r.startsWith('+'))) block('force-push is not allowed.');
      const refspecs = positional.slice(1);
      const targets = refspecs.map((r) => r.replace(/^\+/, '').split(':').pop().replace(/^refs\/heads\//, '')).map((t) => (t === 'HEAD' ? branch : t));
      if (targets.some(isProtected)) block(`pushing to a protected branch (${protectedBranches.join(', ')}) is not allowed. Push your working branch and open a PR.`);
      if (!refspecs.length && isProtected(branch)) block(`the current branch "${branch}" is protected; do not push it directly.`);
    }
    if (g.sub === 'reset' && flags.includes('--hard')) asks.push('git reset --hard discards uncommitted work.');
    if (g.sub === 'branch' && (flags.includes('-D') || (flags.includes('-d') && (flags.includes('-f') || flags.includes('--force'))))) asks.push('git branch -D force-deletes a branch.');
  }

  if (sawCommit && cfg.blockAttribution && /co-authored-by:|generated with/i.test(cmd)) {
    block('this project forbids "Co-Authored-By" / "Generated with" attribution lines in commits and PRs. Remove them and retry.');
  }
  if (asks.length) ask(asks.join(' '));
});
