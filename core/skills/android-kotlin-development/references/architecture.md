# Architecture, modularization, navigation

- **Detect, then follow.** MVVM with unidirectional data flow is the common baseline; MVI adds an explicit reducer and intent type. Do not mix both in one feature. A domain (use case) layer is justified when logic is shared or non-trivial, not as ceremony.
- **Layers:** UI (composables + ViewModel) → domain (optional) → data (repositories, data sources). Dependencies point inward; the UI never touches Retrofit/Room directly. Map network/DB models to UI models at the boundary.
- **Single source of truth:** for offline-capable data the local database is the source; the network refreshes it (see the `mobile-architecture` skill).
- **Modularization:** feature modules + core modules (`core:data`, `core:ui`, `core:designsystem`, `core:network`); expose small public APIs, keep implementation `internal`; use convention plugins or version catalogs for shared build logic. Modularize for build speed and ownership, not by default in a small app.
- **Navigation:** one navigation owner; routes as typed objects where supported by the installed Navigation version; deep links declared in the manifest and validated (see security.md); handle back-stack restoration.
- **DI scopes:** Hilt components match lifetimes (Singleton, ActivityRetained, ViewModel). Do not inject Activity context into singletons.
- **Error model:** repositories return a result type (sealed class / `Result`) with typed errors; the ViewModel maps to UI state (loading, content, empty, error with retry).
- **Feature flags / config:** remote config behind an interface with safe defaults.
- Trade-offs worth stating to the user: modules vs build time, domain layer vs boilerplate, MVI vs MVVM learning curve.
