# Flutter architecture and state management

Applies to: the Flutter/Dart and state packages in `pubspec.yaml`. Check each package's current docs and maintenance status before recommending it.

- **Structure:** feature-first (`features/<name>/{data,domain,presentation}`) over layer-first for anything beyond a small app. Shared code in `core/`. Split into local packages (path dependencies, optionally a workspace tool the project already uses) only when build time or ownership needs it.
- **Layers:** widget → state holder (notifier/cubit/bloc/controller) → repository → data sources (API client, local DB). Widgets never call HTTP or DB. Domain entities separate from DTOs when the API shape is unstable; map at the repository.
- **State management decision table (when none exists; otherwise follow the project):**
  - *Riverpod:* compile-time-safe providers, easy testing and overrides, good for async data and dependency graph; needs team to learn providers/scoping; code generation optional.
  - *Bloc/Cubit:* explicit events/states, strong testability, verbose; good for large teams and strict flows.
  - *Provider/ChangeNotifier:* simple, fine for small apps; easy to leak rebuilds and mutable state.
  - *GetX and similar all-in-one:* convenience at the cost of hidden coupling; follow if already used, do not introduce.
  Never mix two in one feature.
- **Immutability:** immutable state classes (freezed or hand-written), `copyWith`, value equality so rebuilds are precise.
- **Dependency injection:** Riverpod providers, `get_it`/`injectable`, or constructor injection from a root; tests override at the root.
- **Navigation:** the project's router (go_router, auto_route, Navigator 2). Typed routes if supported; redirect/guard logic for auth in one place; deep-link paths map to the same routes.
- **Errors:** sealed result/failure types from repositories; `AsyncValue`/state variants for loading, data, error; global error zone (`FlutterError.onError`, `PlatformDispatcher.onError`) reports to the crash reporter.
- **Forms:** validation in state, not in `build`.
- Cross-platform policy and trade-offs: `mobile-architecture`.
