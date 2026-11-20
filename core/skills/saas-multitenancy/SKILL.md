---
name: saas-multitenancy
description: "Use for multi-tenant SaaS design and review: tenancy model, tenant resolution, data isolation (row-level, schema, database per tenant), per-tenant limits, onboarding/offboarding, admin access. Proves isolation with tests; never changes production data."
---

# SaaS multi-tenancy

Detect first: current tenancy model (single tenant, shared schema with a tenant column, schema per tenant, database per tenant), how the tenant is resolved (subdomain, path, header, token claim), ORM and database features (global scopes, row-level security), shared resources (cache, queues, search index, file storage, jobs), billing link, admin and support access. Extend what exists; migrating tenancy models is a major change that needs an approved plan.

## Rules
- The tenant comes from the authenticated context, never from client-supplied IDs. Every query, cache key, queue job, search document, file path and log line is tenant-scoped.
- Isolation is enforced centrally (global scope, repository layer, row-level security) so a forgotten `where` cannot leak data; application checks alone are insufficient for high-risk data.
- Prove isolation with tests: two tenants, same IDs and slugs, every endpoint, background job, export and search; failing tests are blocking.
- Tenant-owned uniqueness is per tenant (composite unique indexes with the tenant column).
- Support and admin access to tenant data is explicit, audited, time-bound and visible to the tenant where policy requires.
- Never run migrations, backfills or deletions across production tenants without approval, a backup and a staged rollout.

## Read when
| Concern | File |
|---|---|
| Tenancy models, trade-offs, resolution, enforcement, tests | [references/models-isolation.md](references/models-isolation.md) |
| Per-tenant config, limits, noisy neighbors, lifecycle (onboarding, export, deletion), migrations | [references/operations-lifecycle.md](references/operations-lifecycle.md) |

Related: `security-audit` (authn-authz.md for tenant IDOR checks), `database-engineering`, `api-engineering`, `payments-billing`, `system-design`.
