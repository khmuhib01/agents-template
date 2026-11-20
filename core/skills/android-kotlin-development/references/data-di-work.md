# Data, DI and background work

- **Room:** entities and DAOs in the data layer; suspend/Flow DAOs; `@Transaction` for multi-table writes; indexes for query columns and foreign keys. Export schemas and write `Migration`s / auto-migrations with migration tests. Never run queries on the main thread. Paging 3 for large lists if already used.
- **DataStore:** Preferences DataStore for small key-value settings, Proto DataStore for typed data; replaces SharedPreferences for new code. It is not a database.
- **Networking:** follow the project's client (Retrofit/OkHttp or Ktor). Timeouts set, auth interceptor refreshes tokens once (serialize concurrent refresh), no logging of bodies/headers with secrets in release, map HTTP errors to domain errors, handle no-connectivity separately from server errors.
- **Hilt:** `@HiltAndroidApp`, `@AndroidEntryPoint`, `@HiltViewModel`; modules provide interfaces (`@Binds`) over implementations; qualifiers for dispatchers; test modules replace real ones. If the project uses Koin or manual DI, follow it.
- **WorkManager:** use for deferrable, guaranteed work (sync, uploads). Define constraints (network, charging), unique work names with a `ExistingWorkPolicy`, backoff, and make workers idempotent. Expedited work and foreground info have platform limits that vary by OS version; check docs. Periodic minimum interval is 15 minutes.
- **Sync pattern:** outbox table of pending changes + a unique worker that drains it with retry; see `mobile-architecture` for conflict policies.
- **Failure modes:** DB migration crash on update, token refresh races, worker running twice, large payloads in `Data` (limit ~10KB), blocking the main thread in `onCreate`.
