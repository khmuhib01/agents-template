# Jetpack Compose and Material 3

Applies to: the Compose BOM and Material 3 version in the project. Material 3 API names change between versions; read the installed version's docs.

- **State hoisting:** a composable takes `state` and `onEvent` lambdas; the screen-level composable talks to the ViewModel, inner composables stay stateless and previewable.
- **remember vs rememberSaveable:** `remember` is lost on configuration change and process death; use `rememberSaveable` for user-entered UI state that must survive. Do not keep business state in composables.
- **Recomposition:** composables must be idempotent and side-effect free. Avoid reading frequently changing state high in the tree (use lambdas or `derivedStateOf`); pass stable/immutable parameters. Check Compose compiler metrics before claiming a stability problem; strong skipping behavior depends on the Kotlin/Compose version.
- **Lists:** `LazyColumn`/`LazyRow` with stable `key`s and `contentType`; no nested scrolling in the same direction; avoid heavy work in item composables.
- **Side effects:** `LaunchedEffect(key)` for suspend work tied to composition, `DisposableEffect` for register/unregister, `rememberUpdatedState` for latest callbacks, `SideEffect` for publishing to non-Compose code. Wrong or missing keys are the usual bug.
- **Navigation:** follow the project's approach (Navigation Compose, type-safe routes where the installed version supports them). Pass IDs, not objects; one source of truth for back stack state.
- **Material 3:** theme via `MaterialTheme` color scheme, typography and shapes; no hard-coded colors in components; dynamic color only if the project opts in (Android 12+).
- **Adaptive UI:** handle window size classes, foldables, landscape and large screens; test with different font scales and display sizes.
- **Accessibility:** `contentDescription` for non-text images, `semantics` merging, 48dp minimum touch targets, state descriptions, focus order; test with TalkBack.
- **Interop:** `AndroidView`/`ComposeView` for mixed projects; do not migrate screens that are not part of the task.
- **Previews:** `@Preview` for light/dark, large font; they double as documentation.
