# Coroutines and Flow

Applies to: the Kotlin and kotlinx.coroutines versions in the project; check release notes before using newer operators.

- **Scopes:** `viewModelScope` for screen work, an injected application scope for work that must outlive a screen, `lifecycleScope` only in UI. A scope you create must be cancelled by its owner.
- **Dispatchers:** inject them (`class Repo(private val io: CoroutineDispatcher)`) so tests can swap in a test dispatcher. `withContext(io)` around blocking I/O; main-safe suspend functions are the repository's job, not the caller's.
- **Cancellation:** cancellation is cooperative. Do not swallow `CancellationException` in a broad `catch (e: Exception)`; rethrow it. Long loops call `ensureActive()` or suspend.
- **Concurrency:** `coroutineScope { async {} }` for parallel decomposition (a child failure cancels siblings); `supervisorScope` when siblings are independent.
- **StateFlow vs SharedFlow:** `StateFlow` = current state with replay of the latest value (UI state). `SharedFlow` = events; prefer modelling one-shot effects as state that is consumed, or a `Channel`-backed flow, because events can be lost with no collector. Pick one approach per project and follow it.
- **Sharing:** `stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), initial)` keeps upstream work alive across rotation but stops it when the app is backgrounded.
- **Operators:** `flatMapLatest` for search-as-you-type, `debounce` before it, `combine` for multiple sources, `catch` only for upstream errors (it does not see downstream collector errors), `distinctUntilChanged` is implicit for StateFlow.
- **Anti-patterns:** `GlobalScope`, `runBlocking` on the main thread, launching in `init` without owning cancellation, collecting a flow in `onCreate` without lifecycle awareness, mutable collections in state objects.
- **Testing:** `runTest`, a test dispatcher injected everywhere, Turbine (if already in the project) for flows; see testing.md.
