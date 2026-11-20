# Tenant operations and lifecycle

- **Per-tenant configuration:** settings, feature flags, branding and limits in a tenant config store with defaults; cache with explicit invalidation; changes audited.
- **Limits and fairness:** per-tenant rate limits and quotas (API calls, storage, seats, jobs), fair queueing so one tenant cannot starve others (per-tenant concurrency limits), resource usage metrics by tenant, alerts for outliers, graceful degradation.
- **Onboarding:** automated, idempotent provisioning (tenant record, defaults, owner user, seed data); failure leaves no half-created tenant; welcome flow; trial state tied to billing (see `payments-billing`).
- **Roles and permissions:** tenant-level roles, owner transfer, invitations with expiry, last-owner protections, audit log of privileged actions.
- **Data export and deletion:** self-service export (complete, machine-readable) and tenant offboarding with a retention window, then verified deletion across database, search, storage, caches, backups policy and analytics; document what remains (legal retention) and for how long; legal requirements are flagged to the user, not decided by the agent.
- **Migrations:** schema changes must work for all tenants; for schema-per-tenant or database-per-tenant, run them with a tracked, resumable runner, canary tenants first, version table per tenant, and the ability to pause; keep application compatible with N and N-1 schemas during rollout.
- **Backups and restore:** per-tenant restore capability is a product decision (shared schema makes it hard); test it if promised.
- **Support access:** impersonation requires reason, time limit, audit entry, banner, and no access to secrets; read-only by default.
- **Data residency and compliance:** region per tenant if required; keep data, backups and logs in the region; consult the user on compliance claims (do not assert certifications).
- **Analytics and reporting:** cross-tenant analytics run on separate, access-controlled pipelines; per-tenant dashboards respect scoping.
- **Testing lifecycle:** tests for provisioning failure, deletion completeness, quota enforcement and fairness under load.
