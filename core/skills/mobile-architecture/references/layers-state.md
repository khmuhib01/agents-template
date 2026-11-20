# Layers, state, DI, navigation

Applies to: any mobile stack. Name framework APIs only in the framework skills.

- **Layering:** presentation → state holder (ViewModel / Bloc / Riverpod notifier / store) → repository → data sources (remote, local). Add a domain layer when logic is shared by several screens or is complex; skip it for pass-through CRUD.
- **State management trade-offs:** pick by the project's choice first. Where none exists: simple local state for widgets/screens; a unidirectional store for shared state; avoid global mutable singletons. Mixing two solutions in a feature doubles cognitive load.
- **State shape:** immutable, one object per screen (loading/content/error), derived values computed not stored.
- **DI:** constructor injection; one composition root; scopes match lifetimes (app, session, screen); tests replace implementations at the root.
- **Navigation:** one owner of the route table; typed routes/arguments; deep links go through the same routes and re-check authentication; handle restoration after process death.
- **Modularization:** by feature when teams or build times demand it; keep public surface small; shared UI kit and core utilities as separate modules. In small apps, folders are enough.
- **Errors:** typed error model (network, auth, validation, unexpected); user-facing messages mapped in one place; never show raw exceptions.
- **Config/environment:** build-time flavors for endpoints; secrets are not in the app (anything shipped is public).
- **Decisions to surface to the user:** modular vs monolith, domain layer or not, which local database, sync strategy, minimum OS versions.
