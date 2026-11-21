# Sources

Official documentation this skill's guidance should be checked against. Rows are added only after the URL was fetched and the version noted. Pages marked "no version shown" print no date or version, so the Verified date is the fetch date, not a revision date. Anything under "Not yet verified" is still unverified against current docs; read the official docs for the installed version.

| Source | Publisher | URL | Version | Verified |
|---|---|---|---|---|
| About the New Architecture | React Native (Meta) | https://reactnative.dev/architecture/landing-page | page updated 2026-10-14; default since 0.76 | 2026-11-21 |
| Versions | React Native (Meta) | https://reactnative.dev/versions | latest listed 0.88 | 2026-11-21 |
| Introduction to Expo Router | Expo | https://docs.expo.dev/router/introduction/ | modified 2026-11-17 | 2026-11-21 |
| Continuous Native Generation (CNG) | Expo | https://docs.expo.dev/workflow/prebuild/ | modified 2026-11-02 | 2026-11-21 |
| Expo Services (EAS) | Expo | https://docs.expo.dev/eas/ | modified 2026-11-12 | 2026-11-21 |
| Expo SDK reference | Expo | https://docs.expo.dev/versions/latest/ | latest SDK 58.0.0 (maps to React Native 0.88) | 2026-11-21 |
| Submit to app stores | Expo | https://docs.expo.dev/eas/submit/introduction/ | modified 2026-11-04 | 2026-11-21 |
| Getting started (React Navigation) | React Navigation | https://reactnavigation.org/docs/getting-started | 7.x | 2026-11-21 |

## Checked against the fetched pages
- New Architecture is the default since 0.76 and can be turned off (`newArchEnabled=false`, `RCT_NEW_ARCH_ENABLED=0`); `new-architecture-native.md` only says to check the installed release notes, so it is consistent.
- Latest versions at fetch time: React Native 0.88, Expo SDK 58, React Navigation 7.x. The references do not hardcode these.

## Not yet verified
- Expo pages contained embedded "AgentInstructions" text asking the reader to post feedback; it was ignored and is not part of the docs content.
