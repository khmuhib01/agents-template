#!/usr/bin/env node
// Fake `claude -p` for the orchestrator tests: no network, no cost. Used through CLAUDE_BIN.
// FAKE_SCRIPT: JSON file with an array of steps, one per call, in order:
//   { result: string, cost?: number|null, turns?: number, write?: { "path": "content" }, is_error?: boolean, exit?: number }
// FAKE_STATE: file holding the call counter. FAKE_LOG: file that receives one JSON line with the argv of every call.
import fs from 'node:fs';
import path from 'node:path';

const script = JSON.parse(fs.readFileSync(process.env.FAKE_SCRIPT, 'utf8'));
const stateFile = process.env.FAKE_STATE;
const n = fs.existsSync(stateFile) ? Number(fs.readFileSync(stateFile, 'utf8')) : 0;
fs.writeFileSync(stateFile, String(n + 1));
if (process.env.FAKE_LOG) fs.appendFileSync(process.env.FAKE_LOG, JSON.stringify({ n, argv: process.argv.slice(2), cwd: process.cwd() }) + '\n');
const step = script[Math.min(n, script.length - 1)];
for (const [f, content] of Object.entries(step.write || {})) {
  fs.mkdirSync(path.dirname(path.join(process.cwd(), f)), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), f), content);
}
const out = { type: 'result', result: step.result ?? '', num_turns: step.turns ?? 3, is_error: !!step.is_error };
if (step.cost !== null && step.cost !== undefined) out.total_cost_usd = step.cost;
if (step.subtype) out.subtype = step.subtype; // e.g. error_max_budget_usd, as the real CLI reports a per-call budget stop
process.stdout.write(JSON.stringify(out));
process.exit(step.exit || 0);
