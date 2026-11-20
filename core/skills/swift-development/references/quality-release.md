# Profiling, testing, build and App Store release

- **Instruments:** Time Profiler (CPU), Allocations/Leaks (memory), Hangs/Animation Hitches (UI), Network, Energy, SwiftUI view-body counts; profile Release builds on a real device. Report before/after measurements.
- **Testing:** XCTest or Swift Testing (whichever the project uses; Swift Testing needs a recent toolchain: check). Unit-test view models/services with injected dependencies and fake clocks/URLProtocol stubs; async tests with `async` test functions and expectations only when needed; UI tests with XCUITest using accessibility identifiers; snapshot tests only if a tool is already adopted. Narrowest first via `-only-testing`. Parallel/flaky tests: isolate state, avoid real network/time.
- **Build performance:** modularize with SPM packages, avoid giant type-checker-heavy expressions, `-warn-long-expression-type-checking` investigation, build timeline in Xcode, explicit module/dependency caching features per Xcode version (verify), incremental builds, derived data hygiene. Do not edit `.pbxproj` by hand unless unavoidable; prefer xcconfig files for settings.
- **Configurations:** xcconfig per environment, schemes per target/environment, bundle IDs per environment, no secrets in plists.
- **Signing:** automatic signing for development; CI uses App Store Connect API key + fastlane match (or the project's approach); know certificate/profile expiry; capabilities and entitlements must match the provisioning profile.
- **Release:** archive → validate → upload (TestFlight) → review → phased release. **Never upload, submit or release without explicit approval.** Checklist, privacy manifests, review pitfalls, staged rollout and observability: `mobile-release`.
- **Crash reporting:** dSYM upload per build; symbolication verified.
- **Minimum OS policy:** adopt new APIs behind `#available`, keep the deployment target as the project decides.
