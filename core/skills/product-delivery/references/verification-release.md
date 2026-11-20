# Verification and release planning

- **Test strategy:** per requirement, the test level (unit, integration, end-to-end, manual/exploratory, performance, security, accessibility), data and environment needs, what is automated in CI, and acceptance sign-off. Use `test-engineering` and `testing-best-practices`. High-risk areas (money, auth, data migration) get explicit negative and failure-path tests.
- **Traceability matrix:** Requirement ID → design element → tasks/PRs → tests (names/paths) → status → release note entry. Gaps (requirement without test, test without requirement) are reported, not hidden.
- **Quality gates per increment:** tests pass, lint/typecheck/build pass, review done, security review if triggered, accessibility check for UI, performance check if NFR applies, docs updated.
- **Release plan:** environments and promotion path, feature flags and default state, migration order (backward-compatible first; see `database-engineering`), rollout (internal, beta, percentage, full), monitoring and alert thresholds to watch, success metric tracking, support readiness (docs, FAQ, runbook), communication, and a go/no-go owner. Deployment and production data changes need explicit approval naming the environment (`deploy`).
- **Rollback and recovery:** how to disable (flag), revert (artifact), and recover data; what cannot be rolled back (migrations, sent emails/payments) and the forward-fix path.
- **Post-release:** verify with smoke tests, watch metrics for the agreed window, collect feedback, retire flags, update docs, hold a short retrospective, record learnings and update the PRD status.
- **Change control:** scope changes after approval go through the user, update the PRD and trace table, and adjust the plan; no silent scope creep.
- **Handoff to production readiness:** `production-readiness` checks the plan's operational, security, performance, privacy and documentation items before launch.
