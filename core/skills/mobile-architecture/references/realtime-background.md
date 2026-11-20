# Real-time, push and background work

- **Transport choice:** push notifications for waking the app/alerting; WebSocket or SSE for live data while foregrounded; polling only as fallback. Close sockets when backgrounded unless the product requires otherwise and the platform allows it.
- **WebSocket client:** authenticate on connect and handle token expiry, reconnect with backoff + jitter, resume from last event id, dedupe by event id, heartbeat/ping, treat messages as hints that trigger a delta sync when ordering matters.
- **Push:** payload is a hint, not the source of truth; handle missing/duplicate/out-of-order pushes; data vs notification messages behave differently per platform and app state; users can disable notifications, so the app must work without them. Never put sensitive data in the payload.
- **Token lifecycle:** register device tokens after login, refresh on change, unregister on logout, handle invalid-token responses on the server.
- **Background execution:** iOS and Android both throttle and kill. Use the platform scheduler (WorkManager, BGTaskScheduler, or the framework's wrapper), keep tasks short and idempotent, no exact-timing assumptions; long uploads/downloads use the OS-managed background transfer facilities.
- **Deep links / universal links / app links:** associate the domain correctly (verification files), route through normal navigation, require auth where needed, validate every parameter, handle the app-not-installed path.
- **Battery/data:** batch, coalesce, respect low-power and metered-network modes.
- Server-side design of real-time systems belongs to backend skills.
