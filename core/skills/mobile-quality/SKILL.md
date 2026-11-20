---
name: mobile-quality
description: "Use for mobile test strategy, device matrices, performance budgets and profiling, and accessibility review across Flutter, React Native, Swift and Android. Measure-first; framework test APIs live in the framework skills."
---

# Mobile quality: testing, performance, accessibility

Detect first: existing test layers and tools, CI device/emulator setup, performance tooling already in use, accessibility practice, supported OS versions and device classes. Extend what exists; do not add a second test runner.

## Rules
- Test pyramid: many fast logic tests (view models, repositories, mappers), fewer component/widget/UI tests, few end-to-end flows on real or emulated devices for the critical journeys only.
- A bug fix starts with a failing test that reproduces it. Flaky tests are fixed (synchronization, isolation, determinism), never retried into silence or padded with sleeps.
- Performance claims need measurements: release-like build, representative device, before and after, same scenario. Agree budgets (startup, frame time, memory, size) with the user first.
- Accessibility is a requirement, not polish: screen-reader labels, focus order, touch target size, text scaling, contrast, reduce motion. Verify with the real screen reader (TalkBack, VoiceOver), not only automated checks.
- Say plainly which checks were not run (no device, no emulator, no CI access).

## Read when
| Concern | File |
|---|---|
| Test layers, device matrix, CI, flaky tests, test data | [references/testing-strategy.md](references/testing-strategy.md) |
| Startup, jank, memory, battery, size budgets and profiling | [references/performance-budgets.md](references/performance-budgets.md) |
| Accessibility checklist and manual audit steps | [references/accessibility.md](references/accessibility.md) |

Framework detail: `flutter-development`, `react-native-development`, `swift-development`, `android-kotlin-development` (their testing/performance references). Policy: `mobile-architecture`, `mobile-security`, `mobile-release`.

## Verify
List each quality check with command or procedure, result and environment (device, OS, build type).
