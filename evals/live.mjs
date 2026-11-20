#!/usr/bin/env node
// Live skill-trigger eval (opt-in, COSTS MONEY): node evals/live.mjs [--suite legacy|triggers|all] [--repeats N] [--limit N] [--model ID]
//   [--type T --stack a,b --domains x,y] [--max-calls N] [--out FILE] [--dry-run]
// Shows a real model the same skill list Claude Code would (name + description of every model-invocable skill) and asks which
// skills it would invoke for each prompt in cases.json. This approximates trigger behavior; it is not Claude Code itself.
// Needs ANTHROPIC_API_KEY. --dry-run prints the first request and makes no network call. Never run by test.mjs or CI.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadCases, scoreCase, summarize } from './lib.mjs';
import { focusSkills } from '../lib/routing.mjs';

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
  const suite = opt('--suite', 'legacy'); // legacy = cases.json only (the original behaviour) | triggers = evals/triggers/*.json | all
  const repeats = Math.max(1, Number(opt('--repeats', '1')) || 1);
  const maxCalls = Number(opt('--max-calls', '200'));
  const out = opt('--out', '');
  const cases = loadCases(suite, HERE).slice(0, limit || undefined);
  let skills = loadInvocableSkills();
  // Optional realism: show only the skills a project of this type/stack/domains would have installed (focused mode).
  if (opt('--type', '')) {
    const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'core', 'skill-map.json'), 'utf8'));
    const all = new Set(skills.map((s) => s.name));
    const { focus } = focusSkills(map, all, opt('--type', ''), opt('--stack', '').split(',').filter(Boolean), opt('--domains', '').split(',').filter(Boolean));
    const keep = new Set([...map.always, ...focus]);
    skills = skills.filter((s) => keep.has(s.name));
  }
  const known = new Set(skills.map((s) => s.name));
  const system = buildSystem(skills);
  const calls = cases.length * repeats;

  if (args.includes('--dry-run')) {
    console.log(`model: ${model}\nsuite: ${suite}, cases: ${cases.length}, repeats: ${repeats}, API calls: ${calls} (cap --max-calls ${maxCalls})\nskills listed: ${skills.length}, system prompt ~${Math.round(system.length / 4)} tokens per call (cached after the first call)\nCost depends on the model's current price; multiply the token counts by it. Nothing was sent.\n--- system (${system.length} chars) ---\n${system}\n--- first user message ---\n${cases[0].prompt}`);
    return;
  }
  if (calls > maxCalls) { console.error(`${calls} calls exceed --max-calls ${maxCalls}. Raise the cap deliberately or use --limit.`); process.exit(2); }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { console.error('ANTHROPIC_API_KEY is not set. This eval calls the API and costs money; use --dry-run to preview.'); process.exit(2); }

  const results = []; let inTok = 0; let outTok = 0; let cacheRead = 0; let cacheWrite = 0;
  for (let r = 0; r < repeats; r++) {
    for (const c of cases) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 100, system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }], messages: [{ role: 'user', content: c.prompt }] }),
      });
      if (!res.ok) { console.error(`API error ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
      const body = await res.json();
      const u = body.usage || {};
      inTok += u.input_tokens || 0; outTok += u.output_tokens || 0; cacheRead += u.cache_read_input_tokens || 0; cacheWrite += u.cache_creation_input_tokens || 0;
      const got = parseAnswer((body.content || []).map((b) => b.text || '').join(''), known);
      const sc = scoreCase(c, got, true);
      results.push({ case: c, got, ...sc });
      if (!sc.ok || repeats === 1) console.log(`  ${sc.ok ? '✔' : '✖'} "${c.prompt}" → [${got.join(', ')}]${sc.missed.length ? ` missing: ${sc.missed.join(', ')}` : ''}${sc.forbidden.length ? ` forbidden: ${sc.forbidden.join(', ')}` : ''}`);
    }
  }
  const sum = summarize(results);
  console.log(`${sum.passed}/${sum.calls} calls passed (${(100 * sum.passRate).toFixed(0)}%). Tokens: ${inTok} fresh in, ${cacheWrite} cache write, ${cacheRead} cache read, ${outTok} out.`);
  if (out) {
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(out, JSON.stringify({ kind: 'trigger', date: new Date().toISOString().slice(0, 10), model, suite, repeats, skillsListed: skills.length, tokens: { fresh: inTok, cacheWrite, cacheRead, out: outTok }, summary: sum, failures: results.filter((x) => !x.ok).map((x) => ({ prompt: x.case.prompt, got: x.got, missed: x.missed, forbidden: x.forbidden })) }, null, 2) + '\n');
    console.log(`results written to ${out}`);
  }
  process.exit(sum.passed === sum.calls ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
