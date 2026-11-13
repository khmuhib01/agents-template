---
name: flutter-development
description: "Use for Flutter and Dart code: widgets, state management (Provider, Riverpod, Bloc, GetX), navigation, platform channels, pub packages, null safety, and flutter test. Detects Flutter/Dart version and architecture first."
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
