# New Architecture and native code

**Check the installed React Native/Expo SDK release notes for whether the New Architecture is default, optional or the only option; this changed across versions and must not be assumed.**
- **Concepts:** Fabric = new renderer; TurboModules = lazily loaded native modules with typed specs; Codegen generates native interfaces from TypeScript/Flow specs; JSI replaces the async bridge; bridgeless mode removes the old bridge. Hermes is the default engine in current versions (verify).
- **Library compatibility:** before adding a native library confirm it supports the project's RN version and architecture mode (README, release notes, `npx expo-doctor`, React Native Directory metadata). Prefer maintained Expo modules.
- **Writing a native module:** prefer Expo Modules API (Swift/Kotlin) in Expo projects; for bare, TurboModule spec + Codegen. Keep JS API typed, thread-safe, promise-based; handle errors as typed rejections; document minimum OS versions.
- **Config plugins:** modify native config (entitlements, Info.plist, manifest, Gradle) reproducibly with `withInfoPlist`-style mods instead of editing generated files; test with a clean prebuild.
- **Native build config:** Android `gradle.properties`/`build.gradle` (compile/target SDK from the template, Hermes, new-arch flags), iOS Podfile/`Podfile.properties.json`; pods and Gradle caches are the first suspects for odd build failures (`expo prebuild --clean`, `pod install --repo-update`).
- **Platform-specific code:** `.ios.tsx`/`.android.tsx` or `Platform.select`; isolate in adapters; test both.
- **Upgrades:** use the official upgrade helpers/diff tooling and upgrade Expo SDK in steps per `framework-upgrade`; never bump RN alone in an Expo project.
- **Debugging:** native logs (`adb logcat`, Xcode console), `npx react-native doctor`/`expo-doctor`, Metro `--clear`.
