#!/usr/bin/env node
// Builds the Claude Code plugin files from the single source of truth:
//   skills/<name>/SKILL.md   <- global-skills/<name>/SKILL.md with __TEMPLATE_DIR__ -> ${CLAUDE_PLUGIN_ROOT}
//   .claude-plugin/plugin.json and marketplace.json (version from VERSION)
// The marketplace entry's source is this repo root, so init.mjs ships inside the plugin and ${CLAUDE_PLUGIN_ROOT}/init.mjs resolves.
//   node build-plugin.mjs           write the files
//   node build-plugin.mjs --check   exit 1 if they are out of date (run by test.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHECK = process.argv.includes('--check');
const version = fs.readFileSync(path.join(HERE, 'VERSION'), 'utf8').trim();

const outputs = new Map();
const src = path.join(HERE, 'global-skills');
for (const name of fs.readdirSync(src)) {
  const f = path.join(src, name, 'SKILL.md');
  if (!fs.existsSync(f)) continue;
  outputs.set(path.join('skills', name, 'SKILL.md'), fs.readFileSync(f, 'utf8').replaceAll('__TEMPLATE_DIR__', '${CLAUDE_PLUGIN_ROOT}'));
}
outputs.set(path.join('.claude-plugin', 'plugin.json'), JSON.stringify({
  name: 'agents-template',
  description: 'Generate AGENTS.md, CLAUDE.md and .claude/ (rules, skills, agents, hooks) for any project from one project.config.yml. Adds /agents-template:agent-setup-scaffold and /agents-template:agent-init.',
  version,
  author: { name: 'khmuhib01' },
  repository: 'https://github.com/khmuhib01/agents-template',
}, null, 2) + '\n');
outputs.set(path.join('.claude-plugin', 'marketplace.json'), JSON.stringify({
  name: 'agents-template',
  owner: { name: 'khmuhib01' },
  plugins: [{ name: 'agents-template', source: './', description: 'Project setup generator: one config file -> AGENTS.md, CLAUDE.md and .claude/ for Claude Code, Codex and Antigravity.' }],
}, null, 2) + '\n');

let stale = 0;
for (const [rel, text] of outputs) {
  const dst = path.join(HERE, rel);
  const cur = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8') : null;
  if (cur === text) continue;
  stale++;
  if (CHECK) console.error(`  out of date: ${rel}`);
  else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, text); console.log(`  wrote ${rel}`); }
}
if (CHECK && stale) { console.error('Plugin files are out of date. Run: node build-plugin.mjs'); process.exit(1); }
console.log(CHECK ? 'Plugin files are up to date.' : stale ? `Done (${stale} file(s) written).` : 'Plugin files already up to date.');
