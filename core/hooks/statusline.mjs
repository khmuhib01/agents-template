// statusLine command: "[Model] folder branch | ctx 42% | $0.35". Stdin is the JSON Claude Code passes to status lines.
// Never throws: a broken status line should show nothing, not an error.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ESC = String.fromCharCode(27);
const color = (code, text) => `${ESC}[${code}m${text}${ESC}[0m`;

try {
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { /* no stdin */ }
  const model = (input.model && (input.model.display_name || input.model.id)) || 'Claude';
  const cwd = (input.workspace && input.workspace.current_dir) || input.cwd || process.cwd();
  const git = spawnSync('git', ['symbolic-ref', '--short', 'HEAD'], { cwd, encoding: 'utf8' });
  const branch = git.status === 0 ? git.stdout.trim() : '';
  const parts = [`[${model}] ${path.basename(cwd)}${branch ? ' ' + branch : ''}`];
  const pct = input.context_window && input.context_window.used_percentage;
  if (typeof pct === 'number') parts.push(`ctx ${color(pct >= 80 ? 31 : pct >= 60 ? 33 : 32, Math.round(pct) + '%')}`);
  const cost = input.cost && input.cost.total_cost_usd;
  if (typeof cost === 'number') parts.push(`$${cost.toFixed(2)}`);
  process.stdout.write(parts.join(' | ') + '\n');
} catch { /* show nothing */ }
