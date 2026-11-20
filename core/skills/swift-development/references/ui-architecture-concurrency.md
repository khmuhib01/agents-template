# SwiftUI, UIKit, architecture and concurrency

Applies to: the Swift toolchain, deployment target and strict-concurrency settings in the project. APIs are gated by OS version; read Apple's documentation for the deployment target.
- **UI frameworks:** follow the project (SwiftUI, UIKit or mixed). Interop via `UIHostingController` / `UIViewRepresentable`; do not rewrite screens outside the task.
- **Observation:** `@Observable` (Observation framework) needs the OS/toolchain that supports it; otherwise `ObservableObject` + `@Published`. Ownership: `@State` for view-local value state and for `@Observable` objects the view creates, `@StateObject` for `ObservableObject` the view owns, `@Bindable`/`@Binding`/`@ObservedObject`/`@EnvironmentObject` for passed-in state. Wrong ownership causes state resets.
- **View performance:** small views, cheap `body`, stable identities in `ForEach`, `LazyVStack` for long lists, avoid heavy work in `body`/computed properties, check with Instruments (SwiftUI template).
- **Architecture:** MVVM with a view model per screen is the baseline; TCA or other frameworks only if already adopted. Modularize with local SPM packages (feature modules, core, design system); keep public APIs small; dependency injection via initializers or the environment.
- **Concurrency:** async/await; actors for shared mutable state; `@MainActor` for UI-touching types; structured concurrency (`async let`, `TaskGroup`) over detached tasks; cancel tasks tied to view lifetime (`.task` modifier cancels automatically); `Sendable` correctness; migrate to strict concurrency checking incrementally using the compiler's warnings for the installed Swift version. Avoid blocking calls inside actors and unbounded task creation.
- **Combine:** keep where it exists; bridge to async via `values`/`AsyncPublisher` when moving to concurrency; store `AnyCancellable`s and avoid retain cycles.
- **Navigation:** `NavigationStack` with value-based paths where the target allows; deep links parse into the same path state.
- **Error handling:** typed errors, `Result` at boundaries, user-facing messages mapped in one place; no `try!`.
- **Networking:** `URLSession` with async APIs, `Codable` with explicit decoding strategies, timeouts, retry with backoff for idempotent calls, background sessions for large transfers.
