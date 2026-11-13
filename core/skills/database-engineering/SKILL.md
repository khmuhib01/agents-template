---
name: database-engineering
description: "Use for general schema design, migrations, indexes, transactions, and query tuning, or for engines without their own skill (SQLite, MongoDB, etc.). For MySQL or PostgreSQL use mysql-engineering or postgresql-engineering."
---


# Database Engineering

Inspect the actual database engine, schema, ORM, migrations, indexes, and data access patterns. Consider normalization, constraints, uniqueness, foreign keys, transactions, concurrency, query plans, pagination, N+1 access, and data volume. Make migrations reversible where supported and safe for existing data. Avoid destructive schema/data changes without explicit approval and a backup/rollback plan. Do not assume database vendor or ORM.
