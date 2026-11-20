---
name: search-engineering
description: "Use for search features: full-text search, relevance tuning, autocomplete, facets, typo tolerance, indexing pipelines, zero-downtime reindex, tenant/ACL filtering. Compares database search with search engines. No new infrastructure without approval."
---

# Search engineering

Detect first: current search approach (SQL LIKE, database full-text, an engine such as Elasticsearch/OpenSearch, Meilisearch, Typesense, Algolia-class managed service), data volume and growth, languages, query types (keyword, filters, facets, autocomplete, semantic/vector), freshness needs, permission model, hosting constraints. Prefer database full-text for modest needs before adding a search cluster; adding an engine needs an approved decision and an owner.

## Rules
- Define relevance with evidence: a judgment set of real queries with expected results, measured before/after changes (precision@k, nDCG or simple pass/fail lists). Do not tune by anecdote.
- The database remains the source of truth; the index is rebuildable. Indexing is idempotent, retryable and observable.
- Enforce authorization and tenant scoping in every query (filters derived from the authenticated context); never index data a user could not otherwise see without document-level filtering.
- Reindex without downtime (new index + alias swap); schema/analyzer changes are migrations with a rollback.
- Never run destructive index operations (delete index, force merge, reindex) in production without approval.

## Read when
| Concern | File |
|---|---|
| Engine choice, analyzers, relevance, autocomplete, facets, typo tolerance, evaluation | [references/relevance-engines.md](references/relevance-engines.md) |
| Indexing pipelines, sync strategies, reindexing, security, scaling, testing, operations | [references/indexing-ops.md](references/indexing-ops.md) |

Related: `database-engineering` (PostgreSQL/MySQL full-text), `postgresql-engineering`, `saas-multitenancy`, `event-driven-architecture`, `performance-engineering`, `security-audit`.
