# Real-time protocol design

- **Transports:** WebSocket (full duplex, needs proxy/LB support and heartbeats), SSE (HTTP, one-way, auto-reconnect with `Last-Event-ID`, works through most proxies), long polling (fallback). Mobile and browsers differ in background behavior; see `mobile-architecture`.
- **Message envelope:** `{ id, type, channel, seq or version, ts, payload }`; schema-versioned; small payloads with IDs and fetch details via API when large; compress only when beneficial.
- **Authentication:** token in the connection request (header, subprotocol or first message; avoid long-lived tokens in URLs because they leak in logs), validate expiry; allow token refresh without dropping the socket; close with a meaningful code on auth failure.
- **Authorization:** channel/topic ACLs checked at subscribe time and on publish; tenant-prefixed channel names; private channels need server-signed authorization; revoke on role/membership change by forcing unsubscribe.
- **Delivery semantics:** usually at-least-once with dedupe by message ID; ordering per channel via sequence numbers; if strict ordering matters, partition by key; if loss is unacceptable, the client resyncs from the API after reconnect using the last seen sequence.
- **Reconnect and resume:** client backoff with jitter and cap; server keeps a short replay buffer or client calls "events since X"; detect gaps and fall back to full refresh; avoid thundering herd after deploys (jittered reconnect, connection draining).
- **Presence and typing indicators:** presence is ephemeral state with TTL refreshed by heartbeat; compute online status from heartbeats not connection count alone; throttle events; privacy settings.
- **Collaboration:** optimistic local apply with server-side ordering; operational transform/CRDT only when concurrent editing of the same document is a real requirement (choose a maintained library; specialized, state the trade-offs).
- **Errors and close codes:** define error messages, rate-limit responses and close codes; clients show degraded UI instead of blank screens.
- **Security checks:** origin validation for browser WebSockets, CSRF considerations for cookie-authenticated sockets, input validation of every message, message-size and rate limits, no eval of payloads, log without sensitive payloads.
- **Fallback:** keep a plain HTTP path for critical data so features work when sockets are blocked.
