---
name: rust-development
description: "Use for Rust code: ownership/borrowing, error handling (Result, thiserror, anyhow), traits, async (tokio), web frameworks (axum, actix), serde, cargo workspaces and cargo test. Detects edition and crates first."
---

# Rust development

Detect first: edition and MSRV (`Cargo.toml`, `rust-toolchain.toml`), workspace layout, async runtime (tokio, async-std), framework (axum, actix-web, rocket), error crates (thiserror, anyhow), DB crate (sqlx, diesel, sea-orm). Use them; ask before adding crates.

## Rules
- `cargo fmt` always; fix `cargo clippy` warnings instead of `#[allow]` unless justified in a comment.
- No `unwrap()`/`expect()` in library or request-handling code; propagate with `?`. Libraries: typed errors (`thiserror`); binaries: `anyhow` with `.context()`.
- Prefer borrowing over cloning; clone only when ownership is truly needed. Avoid `Rc<RefCell<>>`/`Arc<Mutex<>>` webs; restructure ownership first.
- `unsafe` only with a `// SAFETY:` comment explaining the invariant, and only when asked.
- Async: never block the runtime (`std::thread::sleep`, sync I/O, heavy CPU) inside async code; use `spawn_blocking`. Do not hold a `std::sync::Mutex` guard across `.await`.
- Public API: derive `Debug`, implement std traits where natural, document with `///` and examples.
- sqlx: use the query macros/bind params, never string-built SQL.

## Verify
`cargo check`, `cargo clippy --all-targets`, then `cargo test <name>` (narrowest first), then `cargo test`.
