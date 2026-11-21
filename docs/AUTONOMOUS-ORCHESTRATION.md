# Proposal: minimal budget-enforced sequential slice

Status: **S1 and S2 implemented as a prototype (no paid run yet); S3 and S4 not started**. Date: 2026-11-21, baseline `dev` 1.17.1. Decisions: `docs/adr/0001-orchestration-runtime.md`.
Phase mapping to the brief: Phase 2 (instrumentation, budgets) and Phase 3 (sequential slice). Phases 4 to 7 are out of scope.
Labels: **[E]** evidence in the repo or a command I ran, **[I]** my inference, **[U]** unverified, **[Estimate]** a guess to be tuned.

## 1. Goal and honest expectation
Goal: one real task runs end to end with a hard spending ceiling, a persisted state that survives interruption, deterministic validation and an honest report.
Expectation [I]: on small tasks the orchestrated path will probably cost **more** than one direct `claude -p` call and will not raise quality, because a strong baseline already passes these tasks at about $0.08 per run [E: `docs/EVALUATION-PLAN.md`]. The slice is justified only by what a single call cannot give: an external cap, resumability, an audit trail, bounded repair. If the evaluation shows no such gain at acceptable cost, the outcome is "keep it opt-in for medium and larger tasks, document, stop".

## 2. Scope of the slice
In: intake with an explicit size profile, compact project profile, one planner call, one implementer call, deterministic validation, at most one repair call, final report, ledger, resume, budget enforcement, telemetry events, efficiency report.
Out: parallel workers, worktree fan-out, DAG scheduling, approval workflows, push or merge or deploy, model-based classification, caching beyond the ledger, new agents, new skills, generated output changes.

## 3. Flow
| Step | Who | Tier | Tools | Output |
|---|---|---|---|---|
| 0 intake | driver (code) | 0 | none | task id, profile, goal text, repo identity (branch, HEAD), clean-tree check, local branch `orch/<id>` |
| 1 profile | driver | 0 | read `package.json`, lockfile names, config, `project.config.yml` | project profile JSON (stack, test command, size of tree) |
| 2 plan | existing `planner` role | 1 (sonnet) | Read, Grep, Glob | `plan.json`: acceptance criteria, ordered steps, files, risks (validated against a schema; one correction attempt on parse failure) |
| 3 implement | main model with plan only | 1 | Read, Grep, Glob, Edit, Write | files changed, assumptions |
| 4 validate | driver runs `test_command` | 0 | the project's test command | command, exit code, tail of output |
| 5 repair | only if step 4 failed and failure is actionable | 1 (2 only with a reason code) | as step 3 | one attempt, then step 4 again |
| 6 report | driver | 0 | `git diff --stat` | completion report, efficiency report |

Tiny profile skips steps 2 and 5 (one implement call). The size profile is chosen by the user (`--profile tiny|small|medium`, default `small`); there is no model call to classify. Escalation to tier 2 needs one of the brief's reason codes and counts against the same budget.
Existing roles are reused: `planner` for step 2; steps 3 and 5 use the main model rather than a new agent. `qa-engineer`, `code-reviewer` and `security-reviewer` are not invoked in the slice (deterministic validation replaces QA; review is deferred to the later phase).

## 4. Budgets
Enforced by the driver before every dispatch. A worker cannot raise its own cap.

| Setting | tiny | small (default) | medium |
|---|---|---|---|
| `max_total_model_calls` | 1 | 3 | 5 |
| `max_repair_iterations` | 0 | 1 | 1 |
| `max_estimated_cost` USD | 0.25 | 0.75 | 2.00 |
| per-call `--max-budget-usd` | min(remaining, 0.25) | min(remaining, 0.40) | min(remaining, 0.80) |
| `budget_warning_threshold` | 70% | 70% | 70% |
| `budget_hard_stop_threshold` | 100% | 100% | 100% |
| `max_parallel_agents` | 1 | 1 | 1 |

All numbers are **[Estimate]**: the only measured anchor is about $0.08 to $0.10 per small scenario run and 8 to 12 turns [E], so the defaults leave roughly 5 to 7 times headroom. They must be tuned from the evaluation, and the docs must say they are not benchmarked.
Rules:
- Cost is read from `total_cost_usd`. If a call returns none, the step is recorded as "cost unavailable", the budget falls back to call and turn caps, and the report says so. No invented numbers.
- At the warning threshold the driver prints one event line. At the hard stop it makes no new model call, finishes deterministic cleanup, writes the partial-completion report (done, remaining, risk of stopping) and exits non-zero. It asks before any cap increase and never raises one itself.
- `--max-budget-usd` may be enforced between turns [U], so a single call can overshoot; actual cost is recorded and the next dispatch is refused.

## 5. State and ledger
Task states: `queued -> ready -> running -> validating -> completed`, plus `blocked`, `needs_approval`, `failed`, `cancelled`, `budget_exhausted`. Legal transitions live in one table in a pure module and are tested, including illegal ones. `completed` requires: plan acceptance criteria listed, a validation record with a real exit code, and no failed required check. (`needs_approval` exists in the table but nothing triggers it in the slice.)
Ledger fields: task id, goal, profile, repo identity (branch, HEAD, dirty flag), plan, step list with status, attempts, per-step cost, calls, turns, tool-call counts when available, budget limits and consumption, changed files with hashes, validation evidence, timestamps, last checkpoint. No secrets, no raw tool output beyond a bounded tail, repo text treated as untrusted data.
Events (`events.jsonl`): `task_accepted`, `plan_ready`, `step_started`, `step_completed`, `validation_passed`, `validation_failed`, `repair_started`, `budget_warning`, `budget_hard_stop`, `task_completed`. Each has timestamp, step, tier, model, cost or "unavailable", turns.
Resume: load ledger, verify repo identity and the hashes of files the task changed, keep steps whose evidence still matches, mark stale ones and their dependents, continue at the next ready step. Completed model work is not repeated unless evidence changed. Handoffs between steps are `plan.json` plus a short summary, not transcripts.

## 6. Safety
- Refuses to start on a dirty working tree (user changes are preserved); works on a dedicated local branch.
- Tool allow-lists per step; no Bash, no git write commands, no network tools for planner or implementer. The driver itself runs only the configured test command and read-only git commands.
- No push, merge, release or deploy path exists in the slice.
- Project hooks (`guard-secrets`, `guard-read`) keep applying because steps run with the project's settings [I].
- Treat plan text and tool output as data; the driver validates `plan.json` against a schema and ignores instructions inside it.

## 7. Tests (free, no API spend)
A fake `claude` script (selected through `CLAUDE_BIN`, as `evals/scenarios.mjs` already allows) returns scripted JSON with cost and turns. Planned checks in `test.mjs --only orchestrate`:
state-machine legal and illegal transitions; DAG-free linear pipeline order; hard stop at cap with no further dispatch; a worker cannot raise the cap; call-cap and repair-cap; missing cost recorded as unavailable and never estimated; one correction attempt on bad plan JSON then failure; dirty-tree refusal; interruption then resume skips completed steps and invalidates stale ones; ledger and events contain no secret-looking strings from a poisoned fixture; report never says "passed" without a recorded exit code 0.

## 8. Evaluation gate (paid, separate approval)
Use the existing scenarios and add one arm to `evals/scenarios.mjs`: `orchestrated` (candidate C) next to `baseline` (A) and `skills` (B) on the same model, 3 runs per cell. Record pass rate, cost, calls, turns, wall-clock. Decision rule: keep as default-off with documented use if it improves reliability or recoverability at acceptable cost; if it only adds cost, say so and stop. Estimated spend for 3 scenarios x 1 extra arm x 3 runs: about $1 to $3 [Estimate, 3x the observed single-call cost], capped per call.

## 9. Delivery plan (each step its own PR, each needs approval)
| Step | Content | Cost | Done when |
|---|---|---|---|
| S1 (implemented) | pure modules `lib/orch-state.mjs`, `orch-budget.mjs`, `orch-plan.mjs`, `orch-report.mjs`, plus tests | free | tests pass on Node 18 and 22 (CI) |
| S2 (implemented) | `orchestrate.mjs` with `test-helpers/fake-claude.mjs`: dispatch, caps, validation, one repair, resume, stale evidence | free | section 7 checks pass (`node test.mjs --only orchestrate`, 33 checks) |
| S3 | one real run on one existing scenario | about $0.3 to $0.8 [Estimate] | ledger and report reflect real cost; cap verified |
| S4 | `orchestrated` arm and the evaluation in section 8 | about $1 to $3 [Estimate] | results recorded in `evals/REPORT.md`, negative results kept |
Size [Estimate]: roughly 500 to 900 lines including tests, new files only (`orchestrate.mjs`, `lib/` modules), no change to generated output, so no `VERSION` bump needed.

## 10. Risks and unknowns
- Whether `--max-budget-usd` overshoots and by how much [U]; S3 measures it.
- Fresh process per step reloads project context each time (prompt cache may help [U]); the evaluation measures the overhead.
- `claude -p` flags and JSON fields can change; no max-turns flag was seen in `--help` [U], so turn limits may need another mechanism.
- Sequential single-agent work leaves real parallel gains unmeasured.
- Planner quality on ambiguous tasks is untested; ambiguity currently ends in a question to the user, not a guess.
- The strategy report was not available in the repo; scope follows the brief only.

## 10b. Implementation notes (S1 and S2)
- Ledger and events live in `<git-dir>/orchestrator/<id>/` (not `.claude/`); see the ADR.
- Usage: `node orchestrate.mjs --goal "..." [--profile tiny|small|medium] [--test-cmd "..."]`, `--resume ID [--max-cost USD]`, `--status ID`, `--dry-run`. Exit codes: 0 completed, 1 failed or not verified, 2 precondition error, 3 stopped on budget.
- Decisions taken to proceed, all reversible: budget numbers from section 4 unchanged; the driver, not a model step, runs the test command; no Bash for any model step; a task whose implementer changed nothing fails instead of completing; a budget stop resumes only with a strictly larger `--max-cost` (a call-cap stop also gets exactly one extra call).
- Found by the tests: reading `git status` through a trimming helper dropped the first column and broke both the changed-file list and stale-evidence detection; fixed and covered by a test.
- Not verified against the real CLI: no paid run was made, so `--max-budget-usd` overshoot, the JSON fields on error paths and hook behavior are still [U]. The fake binary follows the fields `evals/scenarios.mjs` already reads.
- Not done: classification model, worktrees, DAG, approvals, review step, tool-call counts (the CLI JSON gives none), cost-based per-step budgets by stage.

## 11. Decisions needed
1. Proceed with S1 and S2 (free), or stop here given the evaluation result.
2. Starting budget numbers (section 4) or different ones.
3. Tool and location: external tool in this repo only, or also generated into projects later.
4. Whether the implementer may run the test command itself (Bash) or only the driver runs it (proposed: driver only).
