# Sources

Official documentation this skill's guidance should be checked against. Rows are added only after the URL was fetched and the version noted. Pages marked "no version shown" print no date or version, so the Verified date is the fetch date, not a revision date. Anything under "Not yet verified" is still unverified against current docs; read the official docs for the installed version.

| Source | Publisher | URL | Version | Verified |
|---|---|---|---|---|
| Jetpack Compose documentation (title not shown in fetch) | Android Developers (Google) | https://developer.android.com/develop/ui/compose/documentation | no version shown | 2026-11-21 |
| Guide to app architecture (title not shown in fetch) | Android Developers (Google) | https://developer.android.com/topic/architecture | no version shown | 2026-11-21 |
| Save data in a local database using Room | Android Developers (Google) | https://developer.android.com/training/data-storage/room | Room 3.0.3 in setup snippet | 2026-11-21 |
| DataStore | Android Developers (Google) | https://developer.android.com/topic/libraries/architecture/datastore | DataStore 1.3.0 in setup snippet | 2026-11-21 |
| WorkManager getting started (title not shown in fetch) | Android Developers (Google) | https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started | WorkManager 2.12.0 in snippet | 2026-11-21 |
| Dependency injection with Hilt (title not shown in fetch) | Android Developers (Google) | https://developer.android.com/training/dependency-injection/hilt-android | Hilt 2.57.1 in snippet | 2026-11-21 |
| Android Gradle plugin release notes (title not shown in fetch) | Android Developers (Google) | https://developer.android.com/build/releases/gradle-plugin | AGP 9.5 / 9.5.1 shown, stability not stated | 2026-11-21 |
| Target API level requirements for Google Play apps | Google (Play Console Help) | https://support.google.com/googleplay/android-developer/answer/11926878 | requires API 36 (Android 16); printed deadline 2026-08-31, extension to 2026-11-01 | 2026-11-21 |
| Coroutines guide | Kotlin Documentation (JetBrains) | https://kotlinlang.org/docs/coroutines-guide.html | page dated 10 August 2026 | 2026-11-21 |

## Checked against the fetched pages
- Architecture guide: UI layer and data layer recommended, domain layer optional.
- DataStore page says to consider migrating from SharedPreferences and prefers Room for large or complex data.
- Play requires targeting API 36 for new apps and updates (printed deadline 2026-08-31, extension 2026-11-01). `gradle-release.md` says to verify target API requirements and names no number, so it is consistent.

## Not yet verified
- Navigation docs were not fetched.
- The AGP page does not state which version is stable, so no AGP number should be taken from it without checking.
