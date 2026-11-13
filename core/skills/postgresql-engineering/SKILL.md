---
name: postgresql-engineering
description: "Use for PostgreSQL specifics: schema, indexes (B-tree, GIN, partial), EXPLAIN ANALYZE, JSONB, lock-safe migrations, transactions, roles/RLS, and slow queries. Detects the server version first."
---

# PostgreSQL engineering

Detect first: server version, extensions (`pg_stat_statements`, PostGIS, pgvector), ORM and migration tool, hosting (RDS, Supabase, Neon). Do not use features newer than the version. Do not connect to production; propose queries and run them only on local or dev data.

## Rules
- Types: `timestamptz` for instants, `text` over `varchar(n)` unless the limit is a real rule, `numeric` for money, `bigint generated always as identity` or `uuid` for keys, `jsonb` (not `json`) for semi-structured data while keeping core fields as columns.
- Enforce integrity in the database: `NOT NULL`, `UNIQUE`, `CHECK`, foreign keys. Postgres does not index foreign keys automatically; index the ones you join or filter on.
- Index choice: B-tree by default; GIN for `jsonb`, arrays, full-text; partial indexes for hot subsets; `INCLUDE` for covering. Composite order is equality then range. Do not index everything; check `pg_stat_user_indexes` for unused ones.
- Diagnose with `EXPLAIN (ANALYZE, BUFFERS)`. Compare estimated and actual rows (stale stats: `ANALYZE`); watch seq scans on big tables and sorts spilling to disk. Use `pg_stat_statements` to find the worst queries.
- Safe migrations: `CREATE INDEX CONCURRENTLY` (outside a transaction block); add constraints as `NOT VALID`, then `VALIDATE CONSTRAINT`; add columns nullable or with a constant default and backfill in batches; set `lock_timeout` for DDL; avoid table rewrites under traffic.
- Keep transactions short with no network calls inside. Use `FOR UPDATE SKIP LOCKED` for job queues. Handle serialization and deadlock retries.
- Use a pooler (PgBouncer) for many connections and check transaction-pooling compatibility with prepared statements.
- Security: least-privilege roles, parameterized queries. RLS policies must be tested with non-owner roles (owners bypass RLS unless `FORCE ROW LEVEL SECURITY`; superusers always bypass). Never expose service credentials to clients.
- Destructive statements, migrations, `VACUUM FULL`, and reindexing need explicit approval. Show the affected row count first.
