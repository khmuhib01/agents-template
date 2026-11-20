# Crash reporting and production observability

- **Crash/ANR reporting:** one reporter (follow the project's: Firebase Crashlytics, Sentry, etc.), initialized early, symbol/mapping/source-map upload in CI per build, release and build-number tags, user identifiers pseudonymous.
- **Privacy:** scrub PII from breadcrumbs, URLs and custom keys; respect consent settings; align with store privacy disclosures.
- **Signals:** crash-free users/sessions, ANR rate, startup time, slow/frozen frames, network error rates per endpoint, key funnel completion, app version distribution.
- **Logging:** structured, leveled, no PII, sampled in production; attach recent breadcrumbs to crashes.
- **Release health:** dashboard per version; alert on regression thresholds agreed with the team; compare against the previous version, not absolute numbers from memory.
- **Non-fatal tracking:** handled errors with fingerprints; cap volume.
- **Kill switches / remote config:** disable a broken feature without a store release; safe defaults when config fetch fails.
- **Tracing:** correlate client requests with server traces via a request id header.
- **Triage process:** owner, severity rubric, link crash groups to issues, post-release review.
