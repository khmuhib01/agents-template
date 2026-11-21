#!/usr/bin/env node
// Installs the global slash-skills (/agent-setup-scaffold, /agent-init, /agent-update) on this PC.
// Usage: node install-global.mjs [--claude] [--codex] [--antigravity] [--all] [--dry-run] [--update] [--force] [--uninstall]
//   (default targets: every agent found on this PC)
// Ownership: a skill is ours only if we created it (the folder did not exist, or held nothing) or you adopted it with --force.
// That is recorded with the sha256 of the SKILL.md we wrote in <skills>/.agent-template.json. An existing folder is never claimed
// because its content looks the same. Update replaces a managed skill only while it still matches the recorded hash; a changed one is
// kept unless --force. --uninstall removes only managed, unmodified skills (a modified one needs --force) and never an unmanaged one.
// Every overwrite or removal is copied to <skills>/.agent-template-backup/<time>/ first. Files are written via temp file + rename.
// --update is the default behaviour, accepted so scripts can say so explicitly.
import crypto from 'node:crypto';
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

const MANIFEST = '.agent-template.json';
const force = args.has('--force');
const uninstall = args.has('--uninstall');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const counts = { installed: 0, updated: 0, same: 0, skipped: 0, removed: 0 };
const log = (m) => console.log(`${dry ? '[dry-run] ' : ''}${m}`);
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const readText = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };

function atomicWrite(file, content) {
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}
function loadManifest(skillsDir) {
  try { const m = JSON.parse(fs.readFileSync(path.join(skillsDir, MANIFEST), 'utf8')); return m && typeof m.skills === 'object' && m.skills ? m : { version: 1, skills: {} }; } catch { return { version: 1, skills: {} }; }
}
// A folder holding nothing (or only temp files left by an interrupted install of ours) can be claimed safely.
const claimable = (dir) => !fs.existsSync(dir) || fs.readdirSync(dir).every((f) => /\.tmp-\d+$/.test(f));
function backup(skillsDir, name) {
  const to = path.join(skillsDir, '.agent-template-backup', stamp, name);
  log(`backup ${path.join(skillsDir, name)} -> ${to}`);
  if (!dry) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.cpSync(path.join(skillsDir, name), to, { recursive: true }); }
}

for (const t of targets) {
  const skillsDir = AGENTS[t].skills;
  const manifest = loadManifest(skillsDir);
  const save = () => { if (!dry) { fs.mkdirSync(skillsDir, { recursive: true }); atomicWrite(path.join(skillsDir, MANIFEST), JSON.stringify(manifest, null, 2) + '\n'); } };
  for (const name of names) {
    const dir = path.join(skillsDir, name);
    const file = path.join(dir, 'SKILL.md');
    const rec = manifest.skills[name];
    const onDisk = readText(file);
    const owned = !!rec && fs.existsSync(dir);
    const modified = owned && (onDisk === null || sha(onDisk) !== rec.sha256);
    if (uninstall) {
      if (!rec) { if (fs.existsSync(dir)) { log(`keep ${dir} (not installed by this tool)`); counts.skipped++; } continue; }
      if (!fs.existsSync(dir)) { delete manifest.skills[name]; continue; }
      if (modified && !force) { log(`keep ${dir} (changed since install; --force removes it after a backup)`); counts.skipped++; continue; }
      const others = fs.readdirSync(dir).filter((f) => f !== 'SKILL.md');
      if (others.length && !force) { log(`keep ${dir} (holds files this tool did not write: ${others.join(', ')}; --force removes it after a backup)`); counts.skipped++; continue; }
      backup(skillsDir, name);
      log(`remove ${dir}`);
      if (!dry) { fs.rmSync(dir, { recursive: true }); delete manifest.skills[name]; }
      counts.removed++;
      continue;
    }
    const raw = fix(fs.readFileSync(path.join(srcDir, name, 'SKILL.md'), 'utf8'));
    let action;
    if (fs.existsSync(dir) && !claimable(dir)) {
      if (!owned) {
        if (!force) { log(`skip ${dir} (exists and was not installed by this tool${onDisk === raw ? '; its SKILL.md is identical but it is still yours' : ''}; --force adopts it after a backup)`); counts.skipped++; continue; }
        action = 'adopt';
      } else if (modified && !force) { log(`skip ${file} (changed since install; --force overwrites it after a backup)`); counts.skipped++; continue; }
      else if (onDisk === raw) { counts.same++; if (!dry && rec.sha256 !== sha(raw)) { manifest.skills[name] = { sha256: sha(raw), installedAt: stamp }; save(); } continue; }
      else action = 'update';
    } else action = 'install';
    if (action !== 'install') backup(skillsDir, name);
    log(`${action} ${file}`);
    counts[action === 'install' ? 'installed' : 'updated']++;
    if (dry) continue;
    fs.mkdirSync(dir, { recursive: true });
    atomicWrite(file, raw);
    manifest.skills[name] = { sha256: sha(raw), installedAt: stamp };
    save();
  }
  if (uninstall && !dry && Object.keys(manifest.skills).length === 0) { try { fs.rmSync(path.join(skillsDir, MANIFEST)); } catch { /* none */ } } else if (uninstall) save();
}
const c = counts;
console.log(`Done for: ${targets.map((t) => AGENTS[t].label).join(', ')}. ${c.installed} installed, ${c.updated} updated, ${c.same} unchanged, ${c.skipped} skipped, ${c.removed} removed. Template path used: ${templatePath}.${c.skipped ? ' Skipped skills were left as they are.' : ''}${dry ? ' (dry run: nothing was written)' : ' Restart the tool(s) to load changes.'}`);
