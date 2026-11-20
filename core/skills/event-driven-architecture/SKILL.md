---
name: event-driven-architecture
description: "Use for event-driven and distributed design: queues, pub/sub, outbox, idempotent consumers, sagas, retries and dead letters, ordering, schema evolution. Warns when synchronous code is simpler. No new infrastructure without approval."
---

# Event-driven architecture and distributed systems

Detect first: existing queues/brokers (database queues, Redis, RabbitMQ, SQS-class, Kafka-class, framework queues), job libraries, event naming and schema conventions, delivery guarantees in use, current pain (latency, coupling, spikes, reliability). Prefer the simplest mechanism that solves the evidenced problem; introducing a broker or splitting services requires an approved decision (ADR) and operational ownership.

## Rules
- Assume at-least-once delivery and duplicates: consumers are idempotent (dedupe by event ID or natural key); handlers are safe to retry.
- Never publish an event and write to the database as two unrelated steps: use a transactional outbox (or the broker/DB's transactional support) so state and events cannot diverge.
- Retries have limits, backoff with jitter and a dead-letter path with alerting and a replay tool; poison messages must not block a queue.
- Events are contracts: versioned schemas, additive evolution, documented ownership; consumers ignore unknown fields.
- Ordering is only guaranteed where designed (partition/group key); state the assumption and test it.
- Make async flows observable: correlation/causation IDs, per-queue lag and age, failure rates, traces across hops.

## Read when
| Concern | File |
|---|---|
| Patterns: outbox, idempotency, sagas, retries/DLQ, ordering, delivery semantics, choosing a broker | [references/patterns.md](references/patterns.md) |
| Event schemas and evolution, testing, observability, operations, when not to use events | [references/contracts-ops.md](references/contracts-ops.md) |

Related: `system-design`, `api-engineering` (webhooks), `database-engineering`, `payments-billing`, `realtime-systems`, `devops-engineering`. Laravel queues: `laravel-best-practices` (queue-jobs rule).
