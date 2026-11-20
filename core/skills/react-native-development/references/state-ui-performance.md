# State, animation, lists and performance

- **Server state vs client state:** TanStack Query (or the project's choice) for remote data with caching, retries, invalidation; Zustand/Redux Toolkit/Context for client state. Persist selectively (query persistence, MMKV/AsyncStorage for non-sensitive, SecureStore for tokens).
- **Rendering:** memoize expensive rows (`React.memo`), stable callbacks/objects for list props, avoid anonymous heavy objects in `renderItem`; use the React Compiler only if the project enables it (verify the installed version supports it).
- **Lists:** `FlashList` (give `estimatedItemSize` if the installed version requires it, stable keys, `getItemType` for heterogeneous rows) or `FlatList` tuned (`windowSize`, `removeClippedSubviews` with care, `getItemLayout` when heights fixed); never ScrollView + map for long lists. Pagination with `onEndReached` guarded against duplicate fetches.
- **Animation:** Reanimated worklets run on the UI thread: animate shared values/derived values, avoid JS-thread `setState` per frame; Gesture Handler for gestures (wrap root with the required provider); layout animations tested on both platforms. Check the Reanimated version supports the project's architecture mode.
- **Images:** `expo-image` or sized/cached images, correct resize, placeholders (blurhash), avoid huge bitmaps.
- **JS performance:** Hermes profiler / React DevTools profiler / Flipper-successor tooling per installed version; reduce re-renders before micro-optimizing; avoid large JSON parsing on the JS thread during interactions; `InteractionManager`/deferred work for heavy init.
- **Startup:** lazy-load screens, trim dependencies, inline requires if configured, avoid heavy work at module scope.
- **Bundle size:** analyze (e.g. source-map explorer-style tools), remove duplicate libs.
- **Offline-first:** follow `mobile-architecture` (offline-sync.md); use NetInfo as a hint, a durable queue (SQLite via expo-sqlite/WatermelonDB/similar the project uses), idempotent writes.
- **Accessibility:** `accessibilityLabel/Role/State`, touch targets, font scaling (`allowFontScaling`, avoid fixed heights), screen-reader testing, reduce-motion.
