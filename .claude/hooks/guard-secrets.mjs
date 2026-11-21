// PreToolUse(Write|Edit|MultiEdit|NotebookEdit): blocks writes to .env / local-only paths and obvious secrets in content.
import path from 'node:path';
import { readInput, loadConfig, block, run } from './lib.mjs';

const SECRET_PATTERNS = [
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['private key block', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['API secret key (sk-...)', /\bsk-[A-Za-z0-9_-]{32,}/],
];

function matchesLocalOnly(rel, raw) {
  const pat = String(raw).trim().replace(/^\.?\//, '');
  if (!pat || pat === '.env') return false;
  if (pat.endsWith('/')) return rel.startsWith(pat) || rel.includes('/' + pat);
  if (pat.startsWith('*')) return rel.endsWith(pat.slice(1));
  return rel === pat || rel.startsWith(pat + '/');
}

run(() => {
  const input = readInput();
  const ti = input.tool_input || {};
  const file = ti.file_path || ti.notebook_path;
  if (!file) process.exit(0);
  const cfg = loadConfig();
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const rel = path.relative(root, path.resolve(input.cwd || root, file)).split(path.sep).join('/');

  if (!rel.startsWith('..')) {
    const base = path.posix.basename(rel);
    if (/^\.env(\..+)?$/.test(base) && !/\.(example|sample|template|dist)$/.test(base)) block(`${rel} holds secrets; edit it yourself, not through Claude.`);
    if ((cfg.localOnly || []).some((p) => matchesLocalOnly(rel, p))) block(`${rel} is a local-only path (git-ignored, may hold credentials or dumps).`);
  }

  const texts = [ti.content, ti.new_string, ti.new_source, ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e && e.new_string) : [])].filter((t) => typeof t === 'string');
  for (const text of texts) {
    for (const [name, re] of SECRET_PATTERNS) {
      if (re.test(text)) block(`content looks like it contains a secret (${name}). Use an environment variable or the project's secret store instead.`);
    }
  }
});
