---
name: android-kotlin-development
description: "Use for native Android apps in Kotlin: Jetpack Compose, Material 3, ViewModel/Flow, Room, Hilt, WorkManager, Android Gradle/AGP builds, intents, permissions, Play release. Detects AGP, Kotlin, Compose and SDK levels first."
---

# Android (Kotlin) development

Detect first: AGP, Gradle and Kotlin versions, version catalog (`gradle/libs.versions.toml`), Compose BOM or XML Views (or both), minSdk / targetSdk / compileSdk, DI (Hilt, Koin, manual), module layout, KSP vs kapt, lint config (Android lint, detekt, ktlint, spotless). Follow what exists; ask before adding a library. Check APIs against the installed versions and the official Android and Kotlin docs; do not assume a version.

## Rules
- UI state flows down, events flow up. A ViewModel exposes immutable state (`StateFlow` of a state class); composables are stateless where possible (state hoisting). Never hold a `Context`, `View` or Activity in a ViewModel.
- Coroutines: structured concurrency only (viewModelScope, lifecycleScope, injected scopes); no `GlobalScope`; inject dispatchers; never block the main thread; rethrow `CancellationException`.
- Collect flows lifecycle-aware in UI (`collectAsStateWithLifecycle` or `repeatOnLifecycle`).
- Survive process death and configuration change: restore needed UI state via `SavedStateHandle` / saved state, not static fields.
- Room schema changes need a migration and exported schema; never `fallbackToDestructiveMigration` outside throwaway data.
- Declare only the permissions needed; request at point of use with a rationale; handle denial and "don't ask again".
- Secrets are never in the APK; tokens in encrypted storage backed by Keystore. Release builds use R8 with tested keep rules.
- Respect the project's modules and dependency direction; do not move code across modules without need.
- Long-running or deferrable work goes through WorkManager (or a correctly typed foreground service), not ad-hoc threads.

## Read when
| Concern | File |
|---|---|
| Coroutines, Flow, StateFlow vs SharedFlow, dispatchers | [references/coroutines-flow.md](references/coroutines-flow.md) |
| Compose state, recomposition, side effects, Material 3, adaptive UI | [references/compose-material3.md](references/compose-material3.md) |
| MVVM/MVI, layers, modularization, navigation | [references/architecture.md](references/architecture.md) |
| Room, DataStore, repositories, networking, Hilt, WorkManager | [references/data-di-work.md](references/data-di-work.md) |
| Lifecycle, process death, permissions, background limits | [references/lifecycle-permissions.md](references/lifecycle-permissions.md) |
| Keystore, network security config, R8, WebView, Play Integrity | [references/security.md](references/security.md) |
| Startup, jank, memory, profiling | [references/performance.md](references/performance.md) |
| Unit, Compose UI, instrumented and integration tests | [references/testing.md](references/testing.md) |
| Gradle, version catalogs, build speed, signing, Play release | [references/gradle-release.md](references/gradle-release.md) |

Shared guidance (policy, checklists, trade-offs): the `mobile-architecture`, `mobile-security` and `mobile-release` skills.

## Verify
`./gradlew` (use the wrapper): `lint`, `testDebugUnitTest`, then module-narrow tasks first (`:feature:x:testDebugUnitTest`); instrumented tests (`connectedDebugAndroidTest`) only when a device or emulator is available. Say clearly what was not run. Do not run Play uploads or signed release builds without approval.
