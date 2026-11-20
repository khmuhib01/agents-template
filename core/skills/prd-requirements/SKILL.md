---
name: prd-requirements
description: "Use for PRDs and requirements: user stories, acceptance criteria, user journeys, non-functional requirements. Traceable, with requirement IDs; open questions stay visible. Needs an approved discovery brief or clear goal."
---

# PRD and requirements

Detect first: an approved discovery brief or clear goal, existing PRD/spec templates and docs location in the project, existing behavior in code and tests, glossary and naming used by the product, stakeholders who approve. Follow the project's template if it has one.

## Rules
- Every requirement is specific, testable and has an ID (`REQ-001`) so it can be traced to design, tests and release notes. Avoid vague words ("fast", "easy", "intuitive") unless quantified.
- Acceptance criteria use observable behavior (Given / When / Then or a checklist), including error, empty, permission, edge and failure cases.
- Separate functional requirements, non-functional requirements (performance, security, privacy, accessibility, reliability, compatibility, observability) and constraints.
- Keep open questions, assumptions and dependencies in the document with owners; never fill a gap with an invented answer.
- State non-goals and out-of-scope items explicitly; mark priority (must / should / could) with reasons.
- Wait for the user's approval of the PRD before technical design or implementation.

## Read when
| Concern | File |
|---|---|
| PRD template, requirement writing, IDs, priorities, non-functional requirements | [references/prd-template.md](references/prd-template.md) |
| User stories, acceptance criteria, user journeys, edge cases, review checklist | [references/stories-journeys.md](references/stories-journeys.md) |

Previous stage: `product-discovery`. Next stage: `product-delivery`. Related: `test-engineering`, `ui-ux-engineering`, `api-engineering`.

## Output
A PRD in the project's docs location (or the reply if none) with requirement IDs, acceptance criteria, journeys, NFRs, open questions and a traceability table skeleton; then wait for approval.
