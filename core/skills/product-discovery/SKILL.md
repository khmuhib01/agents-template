---
name: product-discovery
description: "Use when the request is an idea, problem or vague feature, before any PRD or code: clarify users, problem, scope, assumptions, success metrics, risks and non-goals. Asks questions; does not invent user research or data."
---

# Product discovery

Detect first: existing product docs, README/roadmap, issue tracker context, analytics or feedback the user can share, target users, constraints (time, budget, team, compliance), and what already exists in the codebase. Ask the user rather than guessing; if the answer is unknown, record it as an assumption with an owner and a way to test it.

## Rules
- Separate problem from solution: describe who has the problem, what they do today, and why it matters before proposing features.
- Never invent research, quotes, market sizes, statistics or competitor facts. Mark every claim as **evidence**, **user-stated** or **assumption**, and say where the evidence is missing.
- Keep it proportionate: a small change needs a few questions and a short brief, not a workshop.
- Produce a written artifact the user can approve (a discovery brief); do not start requirements or implementation until the user approves it.
- Success is measurable: define a metric, baseline (or how to get one), target and time frame, and a guardrail metric to avoid harm.

## Read when
| Concern | File |
|---|---|
| Question framework, assumptions, risks, scope and non-goals, discovery brief template | [references/discovery-brief.md](references/discovery-brief.md) |
| Evidence methods, metrics, prioritization, when to stop discovering | [references/evidence-metrics.md](references/evidence-metrics.md) |

Next stage: `prd-requirements`. Related: `system-design`, `technical-documentation`, `build`.

## Output
A discovery brief (problem, users, current behavior, goals and metrics, scope and non-goals, assumptions and risks, open questions, recommended next step) in the project's docs location if one exists, otherwise in the reply; wait for approval.
