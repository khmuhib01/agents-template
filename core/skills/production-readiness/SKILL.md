---
name: production-readiness
description: "Use before launching a feature or service: go/no-go review of security, performance, reliability, observability, backups, rollback, privacy and documentation, with evidence per item. Read-only review; never deploys or changes production."
---

# Production readiness review

Detect first: what is launching (feature, service, migration), its PRD and delivery plan, environments, deployment and rollback mechanisms, monitoring and alerting in place, data stores and backups, dependencies, compliance and privacy constraints, on-call and support ownership. Review with evidence (files, configs, test and monitoring output); do not assume.

## Rules
- Read-only: inspect, run safe checks locally or in staging, and report. Do not deploy, run production migrations, change production configuration, load-test production or access production data without explicit approval.
- Every checklist item ends as **pass**, **fail**, **not applicable** (with reason) or **not verified** (with what is needed). Never mark pass without evidence.
- Severity-rank failures (blocker / should fix before launch / follow-up) with reasoning; the go/no-go decision belongs to the user or named owner, you recommend.
- Flag legal, privacy and compliance questions for the responsible person; do not provide legal conclusions or claim certifications.

## Read when
| Concern | File |
|---|---|
| The checklist (functionality, security, performance, reliability, observability, data, operations, privacy, docs) | [references/checklist.md](references/checklist.md) |
| Report template, go/no-go criteria, launch day and post-launch plan | [references/report-golive.md](references/report-golive.md) |

Related: `security-audit`, `performance-engineering`, `devops-engineering` (observability-reliability.md), `database-engineering`, `deploy`, `product-delivery`, `framework-upgrade`, `mobile-release`, `seo-migration-monitoring`.
