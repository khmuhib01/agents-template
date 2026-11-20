---
name: realtime-systems
description: "Use for real-time features: WebSockets, server-sent events, polling, live updates, presence, chat, collaborative features, reconnection, fan-out scaling. Detects the existing transport first. Server-side design; mobile client behavior in mobile-architecture."
---

# Real-time systems

Detect first: existing transport and library (native WebSocket server, Socket.IO, SSE, framework broadcasting such as Laravel Echo/Reverb/Pusher, managed services), auth model, deployment topology (single node, multiple instances, load balancer, proxies/CDN), message volume and ordering needs, client platforms. Follow the existing stack; adding a new realtime service needs an approved decision (see `system-design`).

## Rules
- Pick the simplest transport that fits: polling for rare updates, SSE for one-way server push, WebSocket for bidirectional or high-frequency. Say why.
- Authenticate and authorize on connect and on every subscription/channel join; re-check when permissions change; short-lived connection credentials; never trust client-sent user or tenant IDs.
- Messages are hints or events with IDs and sequence/versions, not the only copy of state; clients can recover by refetching.
- Design for disconnects: heartbeat, reconnect with backoff and jitter, resume from last event ID, deduplicate, bounded buffers.
- Apply limits: message size, rate per connection, connections per user, subscription counts, backpressure/slow-consumer handling.

## Read when
| Concern | File |
|---|---|
| Transport choice, protocol design, auth, reconnect and resume, presence, ordering | [references/protocol-design.md](references/protocol-design.md) |
| Scaling fan-out, pub/sub, load balancers, deployment, observability, testing | [references/scaling-ops.md](references/scaling-ops.md) |

Related: `mobile-architecture` (client-side realtime and push), `event-driven-architecture`, `security-audit`, `performance-engineering`, `saas-multitenancy` (tenant-scoped channels).
