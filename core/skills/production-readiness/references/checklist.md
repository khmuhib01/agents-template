# Production readiness checklist

Mark each item pass / fail / n.a. / not verified, with evidence.
- **Requirements and tests:** every Must requirement traced to passing tests; acceptance criteria demonstrated; regression suite green; known defects triaged and accepted by the owner.
- **Security:** `security-audit` review done for new surface; authn/authz and tenant isolation tests; secrets in a secret manager, not repo/logs; dependency audit; input validation and output encoding; rate limits on abuse-prone endpoints; security headers/CSP where applicable; admin access audited.
- **Privacy and compliance:** data inventory for new personal data, minimization and retention defined, consent and notices where needed, deletion/export paths, subprocessors recorded, logs free of PII; legal/compliance sign-off requested from the responsible person where applicable.
- **Performance and capacity:** NFR targets measured on production-like data (`performance-engineering`); load/soak test results for expected peak with headroom; database indexes and query plans reviewed; caching correctness; third-party rate limits understood; autoscaling or capacity plan.
- **Reliability:** timeouts, retries with backoff, circuit breakers where needed; graceful degradation when dependencies fail; idempotent writes; queue/DLQ handling; health/readiness checks; graceful shutdown; dependency failure drills in staging.
- **Data:** migrations tested on production-like data, backward compatible with N-1 code, duration and locks estimated; backups enabled and a **restore test done**; RPO/RTO known; seed/config data prepared; no destructive steps without approval.
- **Observability:** structured logs, metrics for golden signals and business KPIs, tracing/correlation IDs, dashboards, alerts with owners and runbooks, error tracking with release tagging, synthetic checks for critical journeys.
- **Release mechanics:** artifact built once and promoted, feature flags with safe defaults, rollout plan, rollback tested (artifact and flag), migration rollback or forward-fix plan, deployment approvals and freeze windows respected.
- **Operations:** on-call and escalation defined, runbooks for known failure modes, support briefed with FAQ/known issues, status communication plan, cost estimate and budget alert, incident process linked.
- **Documentation:** user docs, API docs and changelog, internal architecture notes/ADRs, configuration reference, operational runbooks.
- **Accessibility and UX (user-facing):** accessibility checks per agreed target, supported browsers/devices verified, error/empty states, localization.
- **Mobile / SEO / platform specifics where relevant:** store submission checklist (`mobile-release`), redirect and indexing safeguards (`seo-migration-monitoring`), upgrade risks (`framework-upgrade`).
