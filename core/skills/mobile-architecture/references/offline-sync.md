# Offline-first and synchronization

- **Decide the level first:** (1) online-only with caching, (2) read offline, (3) read+write offline with sync. Each step multiplies complexity; choose the lowest that meets the requirement.
- **Local store:** relational DB (SQLite family) for structured data; key-value only for settings. Include `updated_at`, a client-generated ID (UUID/ULID) and sync state columns (`pending`, `synced`, `failed`) where writes are offline.
- **Read path:** UI observes the local store; a repository refreshes from the network (stale-while-revalidate) and writes into the store. Show cached data with a freshness indicator when relevant.
- **Write path (outbox):** write locally + append to an outbox in one transaction; a single worker drains the outbox in order with retry and exponential backoff plus jitter; requests carry an idempotency key so retries are safe; permanent failures (4xx validation) go to a visible failed state, not infinite retry.
- **Conflict resolution (choose and document):** last-write-wins by server timestamp (simple, can lose edits); field-level merge (better, needs per-field versions); optimistic concurrency with version/ETag and a user-visible conflict step; CRDTs only for collaborative text/lists where justified. Server clocks, not device clocks, decide ordering.
- **Deletes:** soft-delete tombstones until all clients have synced; purge later.
- **Pulling changes:** cursor/`since` token based delta sync, pagination, handle server-side deletes and resets (full resync path).
- **Triggers:** app start, foreground, connectivity regained, push-triggered, periodic background (OS-throttled, never rely on exact timing).
- **Schema migration:** local DB migrations tested from every supported old version; keep the outbox format versioned.
- **Auth interplay:** token refresh single-flight; on logout clear local data and outbox deliberately (warn if unsynced writes exist).
- **Failure modes to test:** duplicate submit, partial batch failure, clock skew, killed mid-sync, server returns 409/412, storage full, user edits during sync.
