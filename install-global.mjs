#!/usr/bin/env node
// Installs the global slash-skills (/agent-setup-scaffold, /agent-init, /agent-update) on this PC.
// Usage: node install-global.mjs [--claude] [--codex] [--antigravity] [--all] [--dry-run] [--force] [--uninstall]
//   (default targets: every agent found on this PC)
// A skill dir we installed carries a .agent-template marker. Managed + changed = updated; identical = untouched;
// existing without the marker (your own skill, or one from before v1.21) = skipped unless --force. Overwrites are backed up.
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

const MARK = '.agent-template';
const force = args.has('--force');
const uninstall = args.has('--uninstall');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const counts = { installed: 0, updated: 0, same: 0, skipped: 0, removed: 0 };
const log = (m) => console.log(`${dry ? '[dry-run] ' : ''}${m}`);

function backup(skillsDir, name) {
  const to = path.join(skillsDir, '.agent-template-backup', stamp, name);
  log(`backup ${path.join(skillsDir, name)} -> ${to}`);
  if (!dry) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.cpSync(path.join(skillsDir, name), to, { recursive: true }); }
}

for (const t of targets) {
  const skillsDir = AGENTS[t].skills;
  for (const name of names) {
    const dir = path.join(skillsDir, name);
    const file = path.join(dir, 'SKILL.md');
    const managed = fs.existsSync(path.join(dir, MARK));
    if (uninstall) {
      if (!fs.existsSync(dir)) continue;
      if (!managed && !force) { log(`skip ${dir} (not installed by this tool; --force removes it)`); counts.skipped++; continue; }
      backup(skillsDir, name);
      log(`remove ${dir}`);
      if (!dry) fs.rmSync(dir, { recursive: true });
      counts.removed++;
      continue;
    }
    const raw = fix(fs.readFileSync(path.join(srcDir, name, 'SKILL.md'), 'utf8'));
    if (fs.existsSync(file)) {
      if (fs.readFileSync(file, 'utf8') === raw) {
        if (!managed && !dry) fs.writeFileSync(path.join(dir, MARK), `${stamp}\n`);
        counts.same++; continue;
      }
      if (!managed && !force) { log(`skip ${file} (exists and was not installed by this tool; --force overwrites after a backup)`); counts.skipped++; continue; }
      backup(skillsDir, name);
      log(`update ${file}`);
      counts.updated++;
    } else { log(`install ${file}`); counts.installed++; }
    if (dry) continue;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, raw);
    fs.writeFileSync(path.join(dir, MARK), `${stamp}\n`);
  }
}
const c = counts;
console.log(`Done for: ${targets.map((t) => AGENTS[t].label).join(', ')}. ${c.installed} installed, ${c.updated} updated, ${c.same} unchanged, ${c.skipped} skipped, ${c.removed} removed. Template path used: ${templatePath}.${c.skipped ? ' Skipped skills were left as they are.' : ''}${dry ? ' (dry run: nothing was written)' : ' Restart the tool(s) to load changes.'}`);
