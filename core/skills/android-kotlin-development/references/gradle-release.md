# Gradle, build speed and Play release

Applies to: the AGP/Gradle/Kotlin versions in the project; consult the AGP release notes before upgrading. Do not upgrade AGP, Gradle or Kotlin unprompted (see `framework-upgrade`).
- **Build hygiene:** version catalog for dependencies, convention plugins for shared config, `kotlin { jvmToolchain }`, KSP instead of kapt where supported by all processors, no dynamic versions (`+`).
- **Speed:** Gradle build cache and configuration cache (enable if compatible with all plugins), parallel execution, non-transitive R classes, avoid unnecessary modules/annotation processors, `--scan` or build profiling before optimizing.
- **Variants:** build types (debug/release) and flavors only when needed; per-flavor config via manifest placeholders and `buildConfigField` (never secrets).
- **Signing:** release key never in the repo; Play App Signing; CI injects the upload key via secrets; verify with `apksigner`/Play console, not by committing keystores.
- **Artifacts:** Android App Bundle (`bundleRelease`) for Play; check size, permissions and merged manifest.
- **Play delivery:** internal → closed → open → production tracks; staged rollout with a halt plan; increment `versionCode` monotonic; keep `mapping.txt` for crash deobfuscation (upload to the crash reporter).
- **Policy checks (verify current rules, they change):** target API level requirements, Data safety form accuracy, permissions declarations (e.g. background location, exact alarms), foreground service types.
- **Approval rule:** never upload to Play, change tracks, or start/modify a rollout without explicit approval; building and testing locally is fine.
- Cross-platform release guidance: `mobile-release` skill.
