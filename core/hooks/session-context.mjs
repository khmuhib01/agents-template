// SessionStart (startup|clear): gives Claude the branch, working-tree state and last commits up front,
// so it does not spend a tool call on `git status` first. Opt-in (session_context: true); costs a few hundred tokens per session.
import { spawnSync } from 'node:child_process';
import { readInput, run } from './lib.mjs';

run(() => {
  const input = readInput();
  const cwd = input.cwd || process.cwd();
  const git = (...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
  const st = git('status', '--short', '--branch');
  if (st.status !== 0) process.exit(0); // not a git repository
  const lines = st.stdout.split(/\r?\n/).filter(Boolean);
  const shown = lines.slice(0, 25);
  if (lines.length > shown.length) shown.push(`... and ${lines.length - shown.length} more changed paths`);
  const log = git('log', '--oneline', '-3');
  const text = `Git state at session start:\n${shown.join('\n')}${log.status === 0 && log.stdout.trim() ? '\nRecent commits:\n' + log.stdout.trim() : ''}`;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text } }) + '\n');
});
