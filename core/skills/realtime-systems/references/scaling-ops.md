# Scaling and operating real-time systems

- **Stateful connections:** each connection lives on one node. Use a shared pub/sub backbone (Redis, NATS, Kafka-class, or a managed service) so any node can broadcast to subscribers connected elsewhere; keep per-connection state minimal and rebuildable.
- **Load balancing:** support WebSocket upgrade and idle timeouts (set above heartbeat interval), sticky sessions only where the library requires them (Socket.IO long-polling fallback), connection draining on deploy with client reconnect guidance, regional placement near users.
- **Capacity:** know per-node connection limits (file descriptors, memory per connection, CPU for fan-out); load test with realistic connection counts, churn and message rates; autoscale on connections and event-loop lag, not only CPU.
- **Fan-out patterns:** topic per entity/tenant; avoid broadcasting everything to everyone; aggregate/batch high-frequency updates (coalesce to latest state every N ms); sample or throttle noisy streams.
- **Backpressure:** per-connection send queues with limits; drop or coalesce for slow consumers, disconnect when exceeded; monitor queue depth.
- **Persistence and replay:** durable event log only where replay is required; otherwise ephemeral channels plus API as source of truth.
- **Managed services vs self-hosted:** weigh cost, limits, latency, vendor lock-in, compliance; abstract behind a small publish interface so the transport can change.
- **Observability:** connections (current, rate of open/close), reconnect rate, message throughput and latency (publish to delivery), queue depth, error and close-code counts, auth failures, per-tenant usage; alerts on reconnect storms.
- **Testing:** unit tests for protocol handlers, integration tests with real sockets (connect, auth failure, subscribe forbidden, reconnect and resume, duplicate delivery), load tests, chaos tests (kill node, network partition), browser and mobile tests for background/foreground transitions.
- **Security operations:** DoS limits per IP/user, abuse detection, WAF support for WebSocket, rotating signing keys, audit of privileged channel access.
- **Deployment:** rolling restarts with draining, protocol versioning for compatibility between old clients and new servers.
