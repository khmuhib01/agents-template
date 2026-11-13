---
name: nodejs-development
description: "Use for Node.js backends (Express, Fastify, NestJS, Hono): routes, middleware, validation, error handling, auth, config, jobs, and ORM use (Prisma, Drizzle, TypeORM, Sequelize). Detects the actual framework first."
---

# Node.js development

Detect first: framework, Node version, ESM vs CJS, TS, ORM or query builder, validation library, test runner, container or process manager.

## Rules
- Validate every body, query, and param at the boundary with the project's validator. Use consistent error shapes and correct status codes; never return stack traces.
- Handle async errors centrally (Express 5 forwards rejected promises; Express 4 needs a wrapper or `next(err)`). Never leave a promise unhandled.
- Enforce authorization on the server for every route. Hash passwords with argon2 or bcrypt; do not hand-roll crypto or JWT parsing. Use short-lived tokens; httpOnly cookies for browser sessions.
- Read env once in a validated config module; fail fast on missing values; never log secrets.
- Do not block the event loop (no sync fs, heavy crypto, or CPU loops in handlers); move heavy work to a queue or worker.
- Database: use the pool, parameterized queries, transactions for multi-step writes, migrations via the project's tool; avoid N+1 (batch, join, include).
- Outbound HTTP needs timeouts; retry with backoff only for idempotent calls.
- Graceful shutdown on SIGTERM (stop accepting, drain, close pool). Structured logs with request IDs. Rate limit and set security headers (`helmet`) on public APIs.
- Prisma: `migrate dev` is for development only; production uses `migrate deploy`. Ask before running any migration against a non-local database.

## Verify
Tests (supertest or framework inject), typecheck, lint.
