# ADR 0001: Runtime boundary and persistence for budget-enforced orchestration

Status: **Proposed**; S1 and S2 of the proposal are implemented as a prototype on branch `feat/orchestrate-s1-s2`. Date: 2026-11-21. Baseline: `dev` at 1.17.1.
Detail and phasing: `docs/AUTONOMOUS-ORCHESTRATION.md`.

## Context
- `init.mjs` generates files; it is not a runtime. Agents in `core/agents/` are 6 to 10 line role prompts with no schema, budget or stop condition [E].
- The only budget feature today is `token_budget`, which warns about always-loaded context at init time. Nothing limits what a session spends [E: README, `init.mjs`].
- A prompt, skill or agent file cannot enforce a spending cap: the model can ignore it, and a skill cannot see cost. `statusline.mjs` reads `cost.total_cost_usd` from its input, but I found no evidence that other hooks receive cost, so in-session enforcement is **unverified** [U].
- `claude -p` exposes what an external driver needs: `--output-format json` (the repo already reads `total_cost_usd` and `num_turns` in `evals/scenarios.mjs`), `--max-budget-usd`, `--allowed-tools`, `--permission-mode`, `--resume`, `--session-id`, `--worktree` (checked with `--help` on the installed 2.1.330 binary) [E].
- Evidence on value: on 8 scenarios the skills arm showed no quality gain and cost 20 to 130 percent more per run; a strong baseline passed every correctness and security grader (`docs/EVALUATION-PLAN.md`) [E]. Orchestration must not be assumed to help.
- Constraints: zero runtime dependencies, Node 18 and 22 on three OSes in CI [E: CLAUDE.md].

## Decision 1: enforcement lives in a deterministic external driver, not in prompts
A zero-dependency Node tool (working name `orchestrate.mjs`, next to `bench-cost.mjs`) runs each step as a separate `claude -p` call. Budget, call counts, permissions and stop conditions are checked by code before every dispatch. The model never decides whether it may continue.
- Before a call the driver passes the remaining budget as `--max-budget-usd` and a per-step tool allow-list. After a call it records `total_cost_usd` and `num_turns`.
- If cost is missing from the output, the driver records "unavailable" and relies on call-count and turn caps. It never estimates silently.
- The tool is **not** generated into target projects in the first version, and nothing about generated output changes.

## Decision 2: persistence is a JSON ledger plus an append-only JSONL event log
`<git-dir>/orchestrator/<task-id>/ledger.json` (state, plan, budget, evidence, repo identity) and `events.jsonl` (one telemetry event per line). Inside `.git` on purpose (changed from the first draft, which used `.claude/`): the files never dirty the working tree, are never committed by accident, and do not break the clean-tree check on resume. Writes use a temporary file and rename. Rejected: SQLite (`node:sqlite` is not available on the Node 18 in CI, and a native dependency breaks the zero-dependency rule) and a database service (no requirement justifies it).

## Decision 3: opt-in, sequential, local-only first
Off unless the tool is invoked. Steps run one after another on a dedicated local branch with a clean-tree check. No push, merge, deploy or Bash git access is granted to any step. Parallel workers, worktree fan-out and approval workflows wait for evidence from the sequential slice.

## Alternatives considered
| Option | Why not (now) |
|---|---|
| New skill or longer agent prompts that say "stay within budget" | cannot be enforced; adds always-loaded context, which already costs about 28 percent more per run in the skills arm |
| In-session hooks that count tool calls | cannot see paid cost [U]; fine as a later guard, not as the budget owner |
| Use Claude Code subagents (Agent tool) as the orchestrator | budget and ledger would sit in the model's context again; host behavior is outside this repo's control |
| Rewrite agents into a framework or add a database | violates "do not rewrite from scratch" and zero dependencies |

## Consequences
- Hard caps and resume become testable for free by pointing `CLAUDE_BIN` at a fake binary (the same hook `evals/scenarios.mjs` uses).
- Cost: each step is a fresh process, so context is reloaded per step and handoffs must be explicit summaries. The slice may cost more than one direct call; the evaluation must measure this and be allowed to conclude that orchestration stays off by default.
- `--max-budget-usd` may be checked between turns, so one call can overshoot slightly [U]; the ledger records actual cost and the next dispatch is refused, so overshoot is bounded by one step.
- The driver depends on `claude -p` flags that can change; the adapter must fail clearly when a flag is missing.

## Revisit when
The paid evaluation of the slice (candidate vs baseline on the existing scenarios) shows no gain in reliability, safety or resumability that justifies its cost, or when a host exposes first-class budget controls.
