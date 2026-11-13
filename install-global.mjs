#!/usr/bin/env node
// Installs the global slash-skills (/agent-setup-scaffold, /agent-init) on this PC.
// Usage: node install-global.mjs [--claude] [--antigravity] [--dry-run]   (default: --claude)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const dry = args.has('--dry-run');
const wantAnti = args.has('--antigravity') || args.has('--all');
const wantClaude = args.has('--claude') || args.has('--all') || !wantAnti;

// Skills hard-code the template path; rewrite it to where this clone actually lives.
const templatePath = root.replace(/\\/g, '/');
const fix = (text) => text.replaceAll('D:/Muhib/claude-template', templatePath);

const srcDir = path.join(root, 'global-skills');
const names = fs.readdirSync(srcDir).filter((n) => fs.existsSync(path.join(srcDir, n, 'SKILL.md')));
const home = os.homedir();

function write(file, content) {
  console.log(`${dry ? '[dry-run] ' : ''}write ${file}`);
  if (dry) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

for (const name of names) {
  const raw = fix(fs.readFileSync(path.join(srcDir, name, 'SKILL.md'), 'utf8'));
  if (wantClaude) write(path.join(home, '.claude', 'skills', name, 'SKILL.md'), raw);
  if (wantAnti) {
    // Antigravity slash commands are workflows: keep only `description` in the frontmatter.
    const desc = (raw.match(/^description:\s*(.+)$/m) || [])[1] || name;
    const body = raw.replace(/^---[\s\S]*?---\s*/, '');
    write(path.join(home, '.gemini', 'antigravity', 'global_workflows', `${name}.md`),
      `---\ndescription: ${desc}\n---\n\n${body}`);
  }
}
console.log(`Done. Template path used: ${templatePath}. Restart the tool to load the new commands.`);
