# Expo/React Native workflows and navigation

Applies to: the installed `expo`, `react-native`, `expo-router`/`@react-navigation/*` versions. Read the changelog/upgrade notes of the installed SDK; behavior (default architecture, supported APIs) changes between releases.
- **Workflows:** *managed* (no native folders; config in `app.json`/`app.config.*`), *prebuild/CNG* (`npx expo prebuild` generates `ios/`/`android/`; customize via config plugins, treat native folders as generated), *bare* (native folders hand-maintained). Move managed → prebuild when a native library needs it; avoid editing generated native files by hand because the next prebuild overwrites them.
- **Dev builds:** Expo Go supports only bundled modules; any custom native code needs a development build (`expo-dev-client`).
- **Expo Router:** file-based routes in `app/`, layouts (`_layout`), groups `(group)`, dynamic `[id]`, typed routes if enabled, API routes only if the installed version supports them. Auth gating via layout redirects or protected route groups, not scattered checks. Deep links come from the route structure plus `scheme` in app config.
- **React Navigation:** typed param lists, one navigator tree, `linking` config for deep links, avoid passing large objects in params (pass ids), reset stacks on logout.
- **Linking/universal links:** associated domains (iOS) and intent filters with `autoVerify` (Android) in app config; handle cold-start URL (`Linking.getInitialURL`) and warm events.
- **Config:** environment via `app.config.js` + `EXPO_PUBLIC_*` only for non-secrets (they are in the bundle); per-environment bundle IDs/variants.
- **TypeScript architecture:** feature folders, strict tsconfig, typed API client and zod/valibot-style validation at boundaries if the project uses one, path aliases configured in both tsconfig and the bundler.
