// PostToolUse(Write|Edit|MultiEdit): runs the project's format_command on the edited file.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readInput, loadConfig, run } from './lib.mjs';

run(() => {
  const input = readInput();
  const file = (input.tool_input || {}).file_path;
  const cfg = loadConfig();
  if (!cfg.formatCommand || !file) process.exit(0);
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const abs = path.resolve(input.cwd || root, file);
  const rel = path.relative(root, abs).split(path.sep).join('/');
  if (!fs.existsSync(abs) || rel.startsWith('..') || /(^|\/)(node_modules|vendor)\//.test(rel)) process.exit(0);
  if (/["`$\r\n]/.test(abs)) process.exit(0); // never splice odd paths into a shell command
  const r = spawnSync(`${cfg.formatCommand} "${abs}"`, { shell: true, cwd: root, encoding: 'utf8', timeout: 60000 });
  if (r.status !== 0) {
    process.stderr.write(`format_command failed (exit ${r.status}) on ${rel}: ${String(r.stderr || r.stdout || '').slice(0, 500)}\n`);
    process.exit(1);
  }
});
