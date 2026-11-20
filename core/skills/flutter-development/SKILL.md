---
name: flutter-development
description: "Use for Flutter and Dart code: widgets, state (Riverpod, Bloc, Provider), navigation, offline data, platform channels, pub packages, flutter test, builds. Detects Flutter/Dart version and architecture first. Not for native Android/iOS projects."
---

# Flutter / Dart development

Detect first: Flutter and Dart SDK constraints (`pubspec.yaml`, `.fvmrc` / FVM), state management, navigation (go_router, Navigator 2, auto_route), code generation (freezed, json_serializable, build_runner), lint rules (`analysis_options.yaml`), folder architecture. Follow them; ask before adding packages.

## Rules
- Sound null safety: avoid `!` unless provably non-null; prefer `final`, `const` constructors and `const` widgets.
- Keep widgets small; no business logic or I/O in `build()`. `build()` must be cheap and side-effect free.
- Dispose controllers, streams, animation controllers and subscriptions; check `mounted` before using `context` after an `await`.
- Use the project's state solution consistently; do not mix in a second one.
- Generated files (`*.g.dart`, `*.freezed.dart`): never edit by hand; regenerate with `dart run build_runner build --delete-conflicting-outputs`.
- Layouts must handle small screens, text scaling and both orientations if supported; use `SafeArea`; no hard-coded sizes for text containers.
- Secrets never in the app bundle; platform-specific changes (AndroidManifest, Info.plist, Gradle, Podfile) only when needed and mentioned in the report.

## Verify
`dart format .`, `flutter analyze`, then `flutter test test/path_test.dart` (narrowest first), then `flutter test`.

## Read when
| Concern | File |
|---|---|
| Architecture, state-management choice, DI, navigation | [references/architecture-state.md](references/architecture-state.md) |
| REST/GraphQL, local DB, offline sync, WebSockets, Firebase | [references/data-offline.md](references/data-offline.md) |
| Platform channels, FFI, isolates, push, deep links, flavors | [references/platform-native.md](references/platform-native.md) |
| Performance, accessibility, localization, testing | [references/quality-a11y.md](references/quality-a11y.md) |
| Secure storage, obfuscation, release builds, crash reporting | [references/security-release.md](references/security-release.md) |

Shared policy and checklists: `mobile-architecture`, `mobile-security`, `mobile-release`. Verify package versions and maintenance status in the project's `pubspec.lock` and the package's official docs before using an API.
