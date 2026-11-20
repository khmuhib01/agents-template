# Tenancy models and isolation

| Model | Isolation | Cost/ops | Use when |
|---|---|---|---|
| Shared schema, tenant column | logical (needs enforcement) | cheapest, simplest to operate and query across tenants | many small tenants, uniform schema |
| Schema per tenant | stronger, per-schema permissions | migrations run per schema, connection/catalog limits at scale | tens to low thousands of tenants with moderate customization |
| Database per tenant | strongest, per-tenant backup/restore/region | highest operational overhead, routing layer needed | regulated or large tenants, data residency |
A hybrid (shared by default, dedicated for large/regulated tenants) is common; design the tenant-resolution layer to allow it.
- **Resolution:** subdomain/custom domain, path prefix, or token claim; validate against the tenant registry, reject unknown tenants, handle domain verification for custom domains. Resolve once per request into a context object; never read the tenant from request bodies.
- **Enforcement:** ORM global scopes or a repository base class that always adds the tenant condition; database row-level security where supported (set the tenant in the session/transaction and test that unscoped queries return nothing); deny by default when no tenant is set; raw SQL and reporting queries are reviewed paths.
- **Beyond the database:** cache keys, queue payloads (carry tenant ID and restore context in workers), search indexes (filter or per-tenant index), file storage prefixes with access checks, websocket channels, emails, webhooks, logs and metrics labels.
- **Uniqueness and IDs:** unique constraints include the tenant; avoid guessable global sequential IDs in URLs.
- **Auth:** users belong to tenants (or have memberships with roles per tenant); token claims include the tenant; switching tenants re-issues context; enterprise SSO per tenant.
- **Isolation tests:** create tenants A and B with overlapping data; for each endpoint, job, export, search and file download, assert A cannot read or write B's objects; run in CI; include a test that fails if a model lacks tenant scoping (reflection check over models).
- **Failure modes:** unscoped admin queries, jobs running without tenant context, cache key collisions, joins to global tables that expose tenant data, tenant ID taken from client input, soft-deleted rows resurfacing.
