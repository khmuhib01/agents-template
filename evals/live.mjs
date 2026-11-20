#!/usr/bin/env node
// Live skill-trigger eval (opt-in, COSTS MONEY): node evals/live.mjs [--limit N] [--model ID] [--dry-run]
// Shows a real model the same skill list Claude Code would (name + description of every model-invocable skill) and asks which
// skills it would invoke for each prompt in cases.json. This approximates trigger behavior; it is not Claude Code itself.
// Needs ANTHROPIC_API_KEY. --dry-run prints the first request and makes no network call. Never run by test.mjs or CI.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

export function loadInvocableSkills() {
  const out = [];
  for (const dir of [path.join(ROOT, 'core', 'skills'), path.join(ROOT, 'templates', '.claude', 'skills')]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      const f = path.join(dir, name, 'SKILL.md');
      if (!fs.existsSync(f)) continue;
      const text = fs.readFileSync(f, 'utf8');
      if (/^disable-model-invocation:\s*true/m.test(text)) continue;
      const d = text.match(/^description:\s*(.*)$/m);
      out.push({ name, description: (d ? d[1] : '').replace(/^"|"$/g, '') });
    }
  }
  return out;
}

export function buildSystem(skills) {
  return [
    'You are Claude Code. These skills are available through the Skill tool:',
    ...skills.map((s) => `- ${s.name}: ${s.description}`),
    '',
    'For the user message, decide which skills (at most 3) you would invoke before answering.',
    'Reply with ONLY JSON: {"skills": ["name", ...]}. Use an empty list if none applies.',
  ].join('\n');
}

export function parseAnswer(text, known) {
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return [];
  try {
    const list = JSON.parse(m[0]).skills;
    return Array.isArray(list) ? list.map(String).filter((n) => known.has(n)) : [];
  } catch { return []; }
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
  const model = opt('--model', 'claude-haiku-5-5');
  const limit = Number(opt('--limit', '0')) || 0;
  const cases = JSON.parse(fs.readFileSync(path.join(HERE, 'cases.json'), 'utf8')).slice(0, limit || undefined);
  const skills = loadInvocableSkills();
  const known = new Set(skills.map((s) => s.name));
  const system = buildSystem(skills);

  if (args.includes('--dry-run')) {
    console.log(`model: ${model}\ncases: ${cases.length}\n--- system (${system.length} chars) ---\n${system}\n--- first user message ---\n${cases[0].prompt}`);
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { console.error('ANTHROPIC_API_KEY is not set. This eval calls the API and costs money; use --dry-run to preview.'); process.exit(2); }

  let pass = 0; let inTok = 0; let outTok = 0;
  for (const c of cases) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 100, system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }], messages: [{ role: 'user', content: c.prompt }] }),
    });
    if (!res.ok) { console.error(`API error ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
    const body = await res.json();
    inTok += (body.usage && body.usage.input_tokens) || 0; outTok += (body.usage && body.usage.output_tokens) || 0;
    const got = parseAnswer((body.content || []).map((b) => b.text || '').join(''), known);
    const ok = c.expect.some((e) => got.includes(e));
    if (ok) pass++;
    console.log(`  ${ok ? '✔' : '✖'} "${c.prompt}" → [${got.join(', ')}] (expected one of: ${c.expect.join(', ')})`);
  }
  console.log(`${pass}/${cases.length} prompts triggered an expected skill. Tokens: ${inTok} in (uncached), ${outTok} out.`);
  process.exit(pass === cases.length ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
