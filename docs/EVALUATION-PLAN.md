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

## 3. Paid run result (2026-11-21, Sonnet, 3 runs per scenario and arm = 18 runs)
Command: `node evals/scenarios.mjs --scenario payments-webhook-refund,tenant-invoice-isolation,migration-lock-safety --runs 3 --out evals/results/scenarios-2026-11-21-sonnet-n3-new3.json`. Recorded in `evals/REPORT.md`. Actual total cost **$1.63** (below the $2 to $5 estimate; cap was $1 per run).

| Scenario | Arm | All graders passed | Passed excluding `test-file-added` | Mean cost | Mean turns |
|---|---|---|---|---|---|
| migration-lock-safety | baseline | 3/3 | 3/3 | $0.076 | 9.7 |
| migration-lock-safety | skills | 3/3 | 3/3 | $0.100 | 9.3 |
| payments-webhook-refund | baseline | 0/3 | 3/3 | $0.079 | 8.7 |
| payments-webhook-refund | skills | 0/3 | 3/3 | $0.103 | 8.3 |
| tenant-invoice-isolation | baseline | 0/3 | 3/3 | $0.085 | 8.3 |
| tenant-invoice-isolation | skills | 0/3 | 3/3 | $0.102 | 8.3 |

Across all 18 runs: correctness 42/42, security 15/15, performance 3/3 in both arms; baseline mean cost $0.080 and 8.9 turns, skills mean cost $0.102 and 8.7 turns.

What this shows, and does not:
- **No quality difference between arms.** Every correctness and security grader passed in every run in both arms, including the traps (idempotent refund on redelivery, cross-tenant read and write, `CREATE INDEX CONCURRENTLY` in a `-- no-transaction` file). Sonnet baseline handled them. These scenarios still do not discriminate, so no skill benefit is shown. Negative result, kept.
- **The skills arm cost about 28 percent more per run** ($0.102 vs $0.080) with about the same number of turns (8.7 vs 8.9). That points to a larger prompt per turn (the generated project context), not extra turns. Three runs per cell is a weak signal; the cost gap was consistent in all 9 pairs.
- **`test-file-added` failed in all 12 runs of two scenarios, in both arms. This was most likely a grader defect, not a model failure.** The grader required a `test/` directory, while the prompt did not say where to put the test, and the work directories were not kept, so I could not inspect what the models wrote. The grader was replaced by `tests-added` (any `*.test.*` or file under `test/` that calls `test(` or `it(`), validated offline; the old results keep the old grader id. The test-quality outcome for these 12 runs is **unknown**, not failed. Also `tests-pass` passes when there are no tests (`node --test` exits 0), so it did not catch this.
- Cost and turns come from the runs; nothing above is extrapolated.

## 4. What the evidence supports so far
1. Skills do not improve outcomes on these 8 scenarios (5 pilot, 3 here) with Sonnet, and cost about 20 to 130 percent more per run in the recorded cells. The README claim stays "no benefit shown".
2. Do not add scenarios of the same kind (single-file fixtures where the trap is a well-known pitfall); a strong baseline passes them. A discriminating scenario needs a hidden requirement the prompt does not hint at, version-specific behavior after the model's knowledge, or a larger repo where convention discovery matters.
3. Rerunning only to recover the test-quality signal costs about $1.1 (12 runs at about $0.09, estimate from this run) and would use `--keep`; not started.

## 5. S4: comparing the orchestrated arm (code done, paid run not started)
Added to `evals/scenarios.mjs`: `--arms ...,orchestrated` runs the fixture (no template files) through `orchestrate.mjs` with profile small, the same cost ceiling as `--budget`, and the scenario's `test_command` or `node --test`. The report gains a per-arm table (pass rate, mean cost, **cost per passing run**, turns, seconds) and every run records wall-clock seconds. Tested offline with the fake `claude` (4 checks, `node test.mjs --only "eval arms"`).

Design choices that affect how to read the result [I]:
- Candidate C is orchestrator **without** the skills template, so it isolates the driver. A "skills plus driver" arm is not included.
- `node --test` passes when the fixture has no tests, so for `migration-lock-safety` the driver's own validation is weak; the scenario graders (hidden) still decide pass or fail.
- A task that ends `failed` or `budget_exhausted` is still graded as it stands and counts as a failed run, with the cost it actually spent.

Proposed paid run (needs approval, not started). The grader `test-file-added` was replaced after the last run, so old baseline and skills numbers for the test-quality category are not comparable; running all three arms together also removes day-to-day drift.
- `node evals/scenarios.mjs --scenario payments-webhook-refund,tenant-invoice-isolation,migration-lock-safety --arms baseline,skills,orchestrated --runs 3 --max-runs 27 --keep --out evals/results/<file>.json` (27 runs; `--keep` leaves the work directories in the temp folder so the test files can be inspected).
- Cost, **estimate only**: baseline about $0.08 and skills about $0.10 per run (measured earlier), orchestrated about $0.15 to $0.30 per run (the S3 task cost $0.108 for two calls; these tasks are larger). Expected total about $3 to $5. The per-run ceiling is $1, so the hard worst case is $27; the driver's own call cap (3 calls) makes an orchestrated run above about $1.2 impossible by construction, apart from one turn of overshoot per call.
- Decision rule, fixed in advance: keep the driver only if it improves reliability or recoverability at acceptable cost. If orchestrated passes no more graders than baseline and costs more per passing run, the result is "no gain on small tasks": keep it opt-in for larger tasks, say so in the README, and do not widen the claim.
