# Mobile test strategy

- **Layers:** (1) logic tests on the dev machine, milliseconds each; (2) component/widget/UI tests with a fake data layer; (3) integration tests against a fake or mock server; (4) a short end-to-end suite on devices for sign-in, core purchase/creation flow, upgrade path.
- **Determinism:** inject clocks, random sources, network and storage; no real network in tests below layer 4; fixed locale, timezone, font scale, animations disabled on test devices.
- **Contract risk:** mock servers drift. Use shared API schemas or contract tests, and keep a small smoke suite against a staging backend.
- **Device matrix:** derive from analytics and support policy: oldest supported OS, current OS, one small and one large screen, one low-memory device, tablet/foldable if supported. Emulators/simulators for breadth, real devices for push, camera, biometrics, performance and Bluetooth.
- **Upgrade tests:** install the previous release, create data, upgrade, verify migrations and sessions.
- **Failure tests:** offline, slow network, server 5xx, token expiry, permission denied, low storage, process death and restore.
- **CI:** unit tests on every PR; UI/integration on merge or nightly if expensive; shard by test target; keep artifacts (logs, screenshots, videos) for failures; quarantine policy with an owner and deadline.
- **Coverage:** use coverage to find untested logic, not as a target number; review test quality (assert behavior, not implementation).
- **Visual tests:** golden/snapshot tests only with pinned fonts, device sizes and one reference platform.
- **Tooling pointers:** Flutter `flutter test`/`integration_test`; RN Jest + Testing Library + Maestro/Detox; iOS XCTest/Swift Testing/XCUITest; Android JUnit + Compose tests + Espresso. Use what the project has.
