---
name: react-native-development
description: "Use for React Native and Expo apps: screens, navigation, lists, native modules, permissions, iOS/Android differences, performance, and build errors. Detects Expo vs bare and the SDK version first."
---

# React Native development

Detect first: Expo (managed, prebuild, dev client) vs bare React Native CLI, RN and Expo SDK versions, New Architecture on or off, navigation (React Navigation or Expo Router), state/data libraries, TS, whether `ios/` and `android/` exist.

## Rules
- Install native-compatible versions with the project's tool (`npx expo install <pkg>` on Expo). Before adding a library, check it supports the installed RN/Expo version and the New Architecture. Prefer Expo SDK modules in Expo projects.
- Do not hand-edit `ios/` or `android/` in managed or prebuild Expo projects; use `app.json`/config plugins. In bare projects keep native edits minimal and explain them.
- Long lists: `FlatList` or `FlashList`, never `ScrollView` plus `map`. Stable `keyExtractor`, memoized row components, no heavy inline objects or functions in `renderItem`.
- Animate with Reanimated or the native driver; avoid JS-thread animation and re-render loops.
- Platform differences: `Platform.select` or `.ios.tsx`/`.android.tsx` files. Handle safe areas, keyboard avoidance, the Android back button, and permissions (declare in app config, request at point of use).
- Tokens go in secure storage (`expo-secure-store`/Keychain), not AsyncStorage. Anything in the bundle is public; never embed API secrets.
- Handle offline and slow network, loading and error states; size and cache images.
- Do not run EAS builds or submissions, store releases, or OTA updates without explicit approval (cost and publishing).

## Verify
Typecheck, lint, tests; run on at least one platform when possible; `npx expo-doctor` on Expo. If Metro misbehaves, restart with `--clear` before changing code.
