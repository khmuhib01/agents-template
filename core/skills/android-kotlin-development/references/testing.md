# Android testing

- **Pyramid:** many JVM unit tests (ViewModels, repositories, mappers), fewer Compose UI tests, few end-to-end instrumented tests.
- **Unit:** JUnit (the version in the project), coroutine `runTest`, injected test dispatcher, fakes preferred over mocks for repositories; MockK only if already used. Turbine for Flow assertions if present.
- **Compose UI tests:** `createComposeRule`, find by semantics (`testTag` sparingly, text/contentDescription first), assert state not implementation; idle synchronization works with Compose, custom waits do not.
- **Instrumented:** Espresso for Views, Hilt test runner and `@TestInstallIn` for DI replacement, in-memory Room, `MockWebServer` for HTTP.
- **Robolectric:** fast Android-framework tests on the JVM; fidelity limits, so keep critical flows on a real emulator.
- **Screenshot tests:** only if the project already uses a tool; pin fonts/densities to avoid flakiness.
- **Migrations:** Room migration tests with exported schemas.
- **Flaky tests:** fix synchronization, disable animations on test devices, never add blind sleeps.
- **CI:** emulator matrix limited to API levels the app supports; split unit vs instrumented jobs; keep reports as artifacts.
- Run narrowest first (`:module:testDebugUnitTest --tests Class`), report what could not run (no emulator).
