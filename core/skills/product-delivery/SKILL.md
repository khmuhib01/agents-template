---
name: product-delivery
description: "Use after an approved PRD to produce the technical delivery plan: feasibility and spikes, data model, API contract, UI flows, test strategy, task breakdown, release plan and traceability. Plans and gates; implementation follows approval."
---

# Product delivery planning

Detect first: the approved PRD with requirement IDs, current architecture and conventions, existing data model, API style and docs, design system, test setup, CI/CD and release process, team and timeline constraints. Reuse existing patterns; do not redesign what the PRD does not touch.

## Rules
- Every plan element traces to requirement IDs; list requirements not yet covered and design elements with no requirement.
- Resolve feasibility risks early with the cheapest check (read code, a small spike, a prototype); report findings honestly, including "not feasible as specified".
- Produce contracts before code: data model changes, API contract (see `api-engineering`), UI flows/states, and the test strategy (see `test-engineering`).
- Slice work into small vertical increments, each independently verifiable and releasable behind a flag where useful.
- Plan the release: migrations, feature flags, rollout, monitoring, rollback, communication. Do not deploy, migrate production data or publish without explicit approval.
- Wait for the user's approval of the plan before implementation; then use `build` for execution.

## Read when
| Concern | File |
|---|---|
| Feasibility, data model, API contract, UI flows, architecture decisions, task breakdown | [references/technical-plan.md](references/technical-plan.md) |
| Test strategy, traceability, release plan, rollout and rollback | [references/verification-release.md](references/verification-release.md) |

Previous stage: `prd-requirements`. Next stage: `build` then `production-readiness`. Related: `system-design`, `database-engineering`, `api-engineering`, `ui-ux-engineering`, `deploy`.
