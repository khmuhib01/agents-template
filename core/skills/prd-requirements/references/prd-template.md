# PRD template and requirement writing

## Template
1. **Title, owner, status, date, version history.**
2. **Background and problem** (link to the discovery brief).
3. **Goals, success metrics and guardrails.**
4. **Users and roles** (with permissions matrix if roles differ).
5. **Scope:** in scope, out of scope (non-goals), future considerations.
6. **User journeys** (see stories-journeys.md).
7. **Functional requirements:** table of ID, statement, priority (Must/Should/Could), rationale, acceptance criteria, source.
8. **Non-functional requirements:** each with a measurable target where possible.
9. **Data and integrations:** entities, data sources, third-party services, migration needs.
10. **UX notes:** key screens/states, content, accessibility, links to designs.
11. **Analytics and instrumentation:** events needed to measure the success metrics.
12. **Release considerations:** rollout, feature flags, support/docs/training, compliance review.
13. **Risks, assumptions, dependencies, open questions** (owner, due date).
14. **Traceability** (requirement → design → tests → release note), filled as work proceeds.

## Writing requirements
- One requirement per row; use "The system shall…" or "A <role> can…"; avoid combining ("and/or").
- Quantify: "search results appear within 1 s for the 95th percentile on the standard dataset" rather than "fast".
- Include negative and permission cases: who must not be able to do this.
- Mark inherited behavior ("unchanged: …") so regression scope is clear.
- IDs are stable; removed requirements are marked withdrawn, not renumbered.
- Prioritize with the user; Must items define the release.

## Non-functional prompts
Performance (latency, throughput, data volume), reliability (availability, recovery), security (authn/authz, data protection, audit), privacy (data minimization, retention, consent; flag legal questions to the user), accessibility (target standard and version agreed with the user), compatibility (browsers, devices, OS versions), localization, observability (logs, metrics, alerts), maintainability, cost, compliance. For each: applicable? target? how verified?
