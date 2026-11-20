# Flutter security and release

- **Secure storage:** `flutter_secure_storage` (Keychain / Keystore-backed) for tokens; check its maintenance and Android encryption options in the installed version; never `shared_preferences` for secrets.
- **Secrets:** nothing sensitive in Dart constants or `--dart-define` values (they end up in the binary); use server-side exchange.
- **Obfuscation:** `--obfuscate --split-debug-info` for release, keep symbols for crash reports; it is a mitigation, not protection.
- **Network:** HTTPS only; pinning only with a rotation plan; avoid `badCertificateCallback` overrides.
- **Platform hardening:** see `mobile-security`; Android manifest `exported`/backup flags, iOS ATS/entitlements.
- **Build/release:** `flutter build appbundle` / `flutter build ipa` (or the project's fastlane/CI), flavors, versioning via `pubspec.yaml` `version: x.y.z+build`, signing configs in Gradle and Xcode, symbol upload. See `mobile-release` for store, rollout, approval rules; Android specifics in the android skill's gradle-release reference.
- **Crash reporting:** initialize before `runApp`, route `FlutterError.onError`, `PlatformDispatcher.instance.onError` and isolate errors to the reporter; upload symbols/mapping per build.
- **Dependencies:** `flutter pub outdated`, review changelogs before upgrading; no discontinued packages for new code; pin versions via `pubspec.lock` for apps.
- **Do not run** store uploads, signing-key changes or paid CI builds without approval.
