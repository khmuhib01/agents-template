# Android performance

Measure first, on a release-like build (R8 on, debuggable off) and a real or representative device.
- **Startup:** Macrobenchmark for cold/warm startup; Baseline Profiles reduce JIT cost; avoid heavy `Application.onCreate` work (lazy init, App Startup library); defer SDKs.
- **Jank:** Perfetto / system trace, Android Studio Profiler, JankStats. Causes: main-thread I/O, big layouts, recomposition storms, image decoding on main.
- **Compose:** Layout Inspector recomposition counts, Compose compiler reports, stable keys in lazy lists, `derivedStateOf`, avoid allocations in hot composables.
- **Memory:** LeakCanary in debug (if present), heap dumps, bitmap sizes (use Coil/Glide with proper sizing), unregistered listeners, long-lived references to Activity.
- **Network/battery:** batch requests, caching headers, WorkManager constraints, avoid wakelocks and polling.
- **APK/AAB size:** R8, resource shrinking, split by ABI/density via AAB, remove unused libraries.
- **StrictMode** in debug to catch disk/network on main thread.
- **Budgets:** agree numbers with the user (startup ms, frame time, size) and report before/after measurements; do not claim improvements without a measurement.
