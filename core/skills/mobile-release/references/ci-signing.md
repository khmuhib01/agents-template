# CI/CD and signing

- **Pipeline stages:** lint/format → unit tests → build debug/dev → UI/integration tests (device farm or emulators, limited matrix) → build signed release artifact → distribute internally → (approval) → store. Fail fast and cache dependencies (Gradle, SPM/CocoaPods, pub, npm/pnpm) with lockfile-based keys.
- **Triggers:** PR = checks only; main/release branch = internal build; tag = release candidate. Release jobs require a protected environment or manual approval.
- **Signing Android:** Play App Signing with an upload key held in CI secrets; keystore as encrypted secret, decoded at build time and deleted; never commit keystores. **iOS:** certificates and profiles managed by fastlane match or Xcode automatic signing in CI with API-key auth; know expiry dates and who renews.
- **Versioning:** semantic marketing version + monotonic build number derived from CI run or commit count; one source of truth (not hand-edited in three files).
- **Secrets:** CI secret store, least privilege API keys (App Store Connect API key, Play service account scoped to the app), no secrets in logs (mask), forks cannot access them.
- **Reproducibility:** pin toolchain versions (Xcode, JDK, Flutter/Node via version files), lockfiles committed.
- **Cost control:** macOS runners and cloud builds cost money; cancel superseded runs, limit device matrices, and ask before enabling paid services.
- **Artifacts:** keep symbols (dSYM, mapping.txt, source maps) per build for crash deobfuscation.
- **Dry runs:** use local builds or validation-only commands (e.g. build without upload) to verify pipeline changes.
