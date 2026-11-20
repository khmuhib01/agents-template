# Security, testing, observability and release (Expo/EAS)

- **Secrets & storage:** `expo-secure-store` (Keychain/Keystore) for tokens; never AsyncStorage for secrets; `EXPO_PUBLIC_*` and anything in the JS bundle is public; no API secrets in the app; deep links validated; WebView origin allow-lists. More in `mobile-security`.
- **Network:** HTTPS only; pinning only with a rotation plan (libraries differ by architecture mode: verify).
- **Testing:** Jest with `jest-expo` preset, React Native Testing Library (query by role/text, user-event style interactions), mock native modules at the boundary, MSW-style network mocks if the project uses them; E2E with Maestro or Detox (whichever is present) on a dev build; test both platforms for platform-specific code. Run narrowest test first.
- **Static:** `tsc --noEmit`, ESLint (expo config), `npx expo-doctor`.
- **Observability:** Sentry (or the project's reporter) with source maps and native symbols uploaded per build; release/dist tagging; scrub PII; performance traces opt-in.
- **EAS Build:** profiles in `eas.json` (development, preview, production), credentials managed by EAS or local, version source (remote/app) and auto-increment settings per profile. **Builds consume paid quota: ask before running.**
- **EAS Submit:** uploads to App Store Connect / Play. **Never run without explicit approval.**
- **EAS Update (OTA):** only JS/asset changes; compatible with the installed native runtime (`runtimeVersion` policy); channels/branches map to build profiles; a bad update reaches users quickly, so test on a preview channel and keep a rollback plan; OTA must not change the app's purpose or bypass store policy. **Publishing requires approval.**
- **Release flow:** see `mobile-release` for signing, staged rollout, crash-free gating.
