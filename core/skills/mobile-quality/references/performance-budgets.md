# Mobile performance budgets and profiling

- **Method:** define the scenario, measure baseline on a release-like build on a real mid-range device, change one thing, measure again, keep the numbers in the report. Debug builds and fast flagship devices mislead.
- **Budgets (set with the user, examples of dimensions, not universal numbers):** cold start time to first usable screen, frame time during scrolling and transitions (dropped/janky frame rate), memory high-water mark, battery/network use for background work, binary/download size, time-to-interactive for key screens.
- **Startup:** defer SDK initialization, avoid synchronous disk/network work before first frame, lazy-load heavy modules, measure cold and warm starts separately.
- **Rendering:** avoid layout thrash and unnecessary rebuilds/re-renders, virtualize long lists, size and cache images, keep heavy work off the UI thread (isolates, background threads, worklets).
- **Memory:** find leaks (retained listeners, controllers, closures capturing contexts), cap caches, downsample images.
- **Network and battery:** batch, cache, compress, use delta sync, respect OS background limits, avoid polling and wake locks.
- **Size:** shrink/minify, strip unused assets and libraries, split by ABI/density, check dependency weight.
- **Tooling:** Android Studio Profiler/Perfetto/Macrobenchmark; Xcode Instruments; Flutter DevTools (profile mode); React Native profilers and Hermes sampling. Stack-specific usage is in each framework skill.
- **Regression control:** track key metrics in CI or release health dashboards; compare to the previous version, alert on agreed thresholds.
- Never claim an improvement without a measurement; say when a device or profiler was unavailable.
