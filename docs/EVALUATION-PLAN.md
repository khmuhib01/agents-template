# Evaluation plan: context cost and discriminating scenarios (P7)

Status: **draft; nothing in section 3 has been run**. Numbers are from `node evals/context.mjs`, `node bench.mjs`, `evals/REPORT.md` and `node evals/scenarios.mjs --check`, measured on `dev` at 1.17.1.

## 1. Does the `always` set cost enough to move skills out of it?
[E] `core/skill-map.json` routes 25 entries into every project; 15 are model-invocable and together carry **770 estimated description tokens** (chars/4). The other 10 are manual-only and cost 0 in the session. For a Laravel project the always-loaded context is about 3,400 tokens (instructions 643, rules 1,078, skill descriptions 1,239, agent descriptions 446), so the always-routed skills are roughly a fifth of it.

Largest rows (tokens / offline eval cases expecting the skill): `security-audit` 63/7, `audit` 62/1, `framework-upgrade` 60/2, `performance-engineering` 60/4, `test-engineering` 60/2, `technical-debt` 57/2.

[I] Removing the five least-evidenced candidates (`audit`, `framework-upgrade`, `technical-debt`, `system-design`, `project-intelligence`) would save about 270 tokens, roughly 8 percent of a Laravel project's static context. By the README's own price ratios (about 4K extra cache-write tokens is roughly $0.015) that is about $0.001 per session (rough arithmetic, not measured). **Recommendation: do not move any skill out of `always` for cost.** The saving is small, the offline eval cannot see routing (it ranks every skill regardless of `always`), and removal would silently take capabilities away from every existing project.

[E] The pilot suggests the larger cost is behavioral, not static: the skills arm cost 1.2x to 2.4x per run (for example $0.224 vs $0.094) with 0 to 2 more turns, far more than 770 description tokens explain. Reducing description text will not fix that. The lever to test is how many extra reads and turns skill content causes. That needs repeated paid runs (section 3), not more static counting.

[E] `evals/context.mjs` (new, free, in `test.mjs`) reproduces the table.

## 2. Why the pilot could not discriminate
All five scenarios passed in both arms, so they cannot show a benefit or a harm to quality. Three new scenarios target behaviors a capable model can plausibly skip when it is not prompted to think about them. Each grader set was checked two ways (`node evals/scenarios.mjs --check`): it fails on the bare fixture and passes on a reference solution; and a deliberately naive solution (the trap) fails the intended graders:

| Scenario | Trap | Naive attempt fails |
|---|---|---|
| `payments-webhook-refund` | provider redelivers events; handler must apply a refund once | `refund-idempotent-on-redelivery`, test missing |
| `tenant-invoice-isolation` | ids are global; reusing `db.findById` leaks other tenants | cross-tenant read, write and CSV graders |
| `migration-lock-safety` | 40M-row table; index must be `CONCURRENTLY` in a `-- no-transaction` file, with down migrations | `index-built-concurrently`, `down-migrations-present` |

Limits [I]: a strong baseline model may still pass them (then they will not discriminate either); the graders are deterministic but encode one reasonable solution; the migration check is a static parse, not a database run. A naive attempt failing proves the graders are sensitive, not that the skills help.

## 3. Proposed paid run (needs approval, not started)
- Scope: the 3 new scenarios, arms `baseline` and `skills`, 3 runs each = **18 runs**. Command: `node evals/scenarios.mjs --scenario payments-webhook-refund,tenant-invoice-isolation,migration-lock-safety --runs 3 --out evals/results/<file>.json`.
- Cost, **estimate only**: the pilot's mean cost per run was about $0.08 (baseline) and $0.13 (skills). These tasks write code and tests, so assume up to roughly double: about $2 to $5 in total. The built-in cap is $1.00 per run and 20 runs per invocation, so the hard ceiling is $18, which the estimate should stay well under.
- Decision rule: report pass rates per grader category, mean cost and turns per arm, with 3 runs per cell as a weak signal. If both arms pass everything again, say so and stop adding scenarios of this kind; if skills cost more with no quality gain, record that as a negative result and consider disabling or shrinking the skills arm by default.
- Not covered: live trigger accuracy (`evals/live.mjs`, needs `ANTHROPIC_API_KEY`) and an orchestration comparison; neither exists yet.
