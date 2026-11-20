---
name: mobile-release
description: "Use for mobile CI/CD, code signing, store submission (App Store, Google Play), staged rollout, crash reporting, release health and store listing. Detects the build/release tooling first. Never submits, publishes or spends CI credits without approval."
---

# Mobile release engineering

Detect first: build tooling (Gradle, Xcode/xcodebuild, fastlane, EAS, Codemagic, Bitrise, GitHub Actions, Xcode Cloud), signing setup, versioning scheme, release branches/tags, crash reporter and analytics, store accounts' automation (never assume access). Follow the existing pipeline; do not replace it unprompted.

## Hard rules
- **Never** upload to a store, submit for review, change a rollout, push an OTA update, trigger a paid CI/EAS build, rotate signing keys, or alter store listings without explicit approval naming the target. Local builds, tests and dry runs are fine.
- Signing keys, certificates, provisioning profiles, keystores and API tokens never go in the repo or logs; use CI secret stores; document who holds the recovery copy.
- Version numbers are monotonic and unique per store; never reuse a build number.
- Store policies and review requirements change; read the current official guidelines for the specific submission instead of relying on memory.

## Read when
| Concern | File |
|---|---|
| CI pipeline design, signing, versioning, caching, secrets | [references/ci-signing.md](references/ci-signing.md) |
| Store submission, review readiness, staged rollout, hotfix and rollback | [references/store-release.md](references/store-release.md) |
| Crash/ANR reporting, release health, observability, kill switches | [references/observability.md](references/observability.md) |
| Store listing and app store optimization (ASO) | [references/aso.md](references/aso.md) |

Framework detail: `flutter-development`, `react-native-development` (EAS), `swift-development`, `android-kotlin-development` (gradle-release.md).

## Verify
Release checklist walked item by item with evidence (build number, artifact checksum, test run, crash-free baseline). Say what was not verified and what needs the user's approval or credentials.
