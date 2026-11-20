---
name: mobile-architecture
description: "Use for mobile app structure and cross-platform decisions: layering, state, navigation, offline-first sync, conflict resolution, background work, adaptive UI. Policy and trade-offs; framework APIs live in the framework skills."
---

# Mobile architecture (platform-agnostic)

Detect first: the existing layering, state approach, navigation, local database, API style, and whether the app already works offline. Extend what exists; do not introduce a second state solution, DI approach or database. When no structure exists, propose the smallest one that fits and state the trade-offs.

## Rules
- Separate UI, state holders, domain logic (only where it earns its place) and data. UI never calls the network or database directly. Map transport models to UI models at the boundary.
- One source of truth per piece of data. For offline-capable features the local store is the source and the network synchronizes it.
- Design every screen for: loading, content, empty, error with retry, offline, and partial data.
- Writes that must not be lost go through a durable outbox with idempotency keys, never fire-and-forget from the UI.
- Schema versions on device and API versions in the wild both exist; migrations are mandatory and tested, and older app versions must keep working against the API (or be force-upgraded deliberately).
- Treat the OS as hostile to background work: the app can be killed, throttled or offline at any moment.
- Keep platform conventions: navigation patterns, back behavior, permissions UX, touch targets, safe areas, text scaling.

## Read when
| Concern | File |
|---|---|
| Layers, state, DI, navigation, modularization decisions | [references/layers-state.md](references/layers-state.md) |
| Offline-first, sync, conflicts, outbox, retries, caching | [references/offline-sync.md](references/offline-sync.md) |
| Real-time, push, background execution, deep links | [references/realtime-background.md](references/realtime-background.md) |
| UI engineering principles, adaptive layout, states | [references/ui-principles.md](references/ui-principles.md) |

Framework specifics: `flutter-development`, `react-native-development`, `swift-development`, `android-kotlin-development`.

## Verify
Walk the failure paths: airplane mode, slow network, token expiry mid-request, app killed during a write, upgrade from the previous app version with existing local data. State which were tested and which were reasoned only.
