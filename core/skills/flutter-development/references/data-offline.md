# Flutter data layer, offline and real-time

- **HTTP:** `dio` or `http` per project; one client with interceptors (auth, retry, logging off in release); timeouts; map status codes to typed failures; JSON via `json_serializable`/`freezed` (generated files not hand-edited).
- **GraphQL:** the project's client (e.g. `graphql_flutter`, `ferry`); normalized cache vs repository-level cache decision; generate types from the schema if the project does.
- **Local DB:** Drift (typed SQL on SQLite, migrations with schema versions and tests), sqflite (low-level), Isar or ObjectBox (object stores). **Check each package's current maintenance status and Flutter version support before adopting; prefer what the project already has.** Hive-style key-value only for small settings. `shared_preferences` is not a database or secret store.
- **Offline-first:** follow `mobile-architecture` (offline-sync.md): UI watches local streams (`watch()` queries), repository refreshes and writes through an outbox, idempotency keys, conflict policy chosen and documented.
- **Background sync:** `workmanager`/platform schedulers are best-effort and OS-throttled; run sync on app resume and connectivity change too (`connectivity_plus` signals are hints, not proof of reachability).
- **WebSockets:** `web_socket_channel`; reconnect with backoff, auth on connect, parse in an isolate for heavy payloads, close in `dispose`/provider `onDispose`; see `mobile-architecture` realtime reference.
- **Firebase:** FlutterFire packages; `flutterfire configure` generated options are not secrets but keep security rules strict server-side; Firestore offline persistence has its own semantics (not a replacement for domain sync design); App Check where applicable.
- **Pagination/caching:** cursor pagination; image caching via `cached_network_image` or equivalent with size limits.
- **Serialization performance:** large JSON decoding off the UI isolate (`Isolate.run` / `compute`).
