#!/usr/bin/env node
// Installs the global slash-skills (/agent-setup-scaffold, /agent-init, /agent-update) on this PC.
// Usage: node install-global.mjs [--claude] [--codex] [--antigravity] [--all] [--dry-run]   (default: every agent found on this PC)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const dry = args.has('--dry-run');
const home = os.homedir();

// Every supported agent reads the same SKILL.md format; only the global folder differs.
const AGENTS = {
  claude: { label: 'Claude Code', root: path.join(home, '.claude'), skills: path.join(home, '.claude', 'skills') },
  codex: { label: 'Codex', root: path.join(home, '.codex'), skills: path.join(home, '.codex', 'skills') },
  antigravity: { label: 'Antigravity (Gemini)', root: path.join(home, '.gemini'), skills: path.join(home, '.gemini', 'config', 'skills') },
};
// --claude / --codex / --antigravity pick targets; --all forces all three; default: every agent installed on this PC.
let targets = Object.keys(AGENTS).filter((k) => args.has(`--${k}`));
if (args.has('--all')) targets = Object.keys(AGENTS);
if (!targets.length) targets = Object.keys(AGENTS).filter((k) => fs.existsSync(AGENTS[k].root));
if (!targets.length) targets = ['claude'];

// Skills hard-code a placeholder; rewrite it to where this clone actually lives.
const templatePath = root.replace(/\\/g, '/');
const fix = (text) => text.replaceAll('__TEMPLATE_DIR__', templatePath);

const srcDir = path.join(root, 'global-skills');
const names = fs.readdirSync(srcDir).filter((n) => fs.existsSync(path.join(srcDir, n, 'SKILL.md')));

function write(file, content) {
  console.log(`${dry ? '[dry-run] ' : ''}write ${file}`);
  if (dry) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

for (const name of names) {
  const raw = fix(fs.readFileSync(path.join(srcDir, name, 'SKILL.md'), 'utf8'));
  for (const t of targets) write(path.join(AGENTS[t].skills, name, 'SKILL.md'), raw);
}
console.log(`Done for: ${targets.map((t) => AGENTS[t].label).join(', ')}. Template path used: ${templatePath}. Restart the tool(s) to load the new commands.`);
