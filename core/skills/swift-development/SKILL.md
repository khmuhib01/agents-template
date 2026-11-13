---
name: swift-development
description: "Use for Swift code: iOS/macOS apps (SwiftUI, UIKit), Swift Package Manager, Swift concurrency (async/await, actors), Xcode projects, and XCTest / Swift Testing. Detects Swift version and project type first."
---

# Swift development

Detect first: Swift tools version (`Package.swift`) or Xcode project/workspace, deployment targets, UI framework (SwiftUI, UIKit, both), architecture (MVVM, TCA, MVC), dependency manager (SPM, CocoaPods), linter (SwiftLint, swift-format), test framework (XCTest, Swift Testing). Follow them; ask before adding dependencies.

## Rules
- No force unwraps (`!`) or `try!` outside tests and provably safe cases; use `guard let` / `if let`.
- Prefer value types (`struct`, `enum`) and `let`; mark classes `final` unless designed for subclassing.
- Concurrency: async/await and actors over completion handlers when the project supports it; UI updates on `@MainActor`; avoid retain cycles (`[weak self]` in escaping closures that capture self).
- SwiftUI: keep views small, state ownership clear (`@State` local, `@StateObject`/`@Observable` owners, `@Binding` passed down); no heavy work in `body`.
- Respect the deployment target; gate newer APIs with `if #available`.
- Do not edit `.pbxproj` by hand unless unavoidable; secrets never in the bundle or `Info.plist`.

## Verify
SwiftLint if configured, then `swift build` / `swift test --filter Name` for packages, or `xcodebuild test -scheme <Scheme> -destination '<simulator>' -only-testing:<Target/Class>` for apps (narrowest first).
