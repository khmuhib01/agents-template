---
name: go-development
description: "Use for Go code: modules, packages, errors, goroutines/channels, context, net/http and popular routers (chi, gin, echo), database/sql, and go test. Detects the Go version and tooling first."
---

# Go development

Detect first: Go version (`go.mod` `go` line, `toolchain`), module path, router/framework, DB layer (database/sql, sqlx, pgx, gorm, sqlc), linter (`golangci-lint` config), layout (`cmd/`, `internal/`, `pkg/`). Follow them; do not add new dependencies without asking.

## Rules
- Run `gofmt`/`goimports`; never hand-format. Keep packages small with a clear name; no `util`/`common` dumping grounds; `internal/` for non-public code.
- Errors: return them, never ignore (`_ =` only with a comment). Wrap with `fmt.Errorf("doing x: %w", err)`; compare with `errors.Is`/`errors.As`. `panic` only for programmer errors at startup.
- Pass `context.Context` as the first parameter through every I/O call; respect cancellation; never store it in a struct.
- Concurrency: every goroutine has a clear exit (context, closed channel, `errgroup`). Protect shared state with a mutex or own it in one goroutine. Run `go test -race` when touching concurrent code.
- Accept interfaces, return concrete types; define interfaces where they are used, keep them small.
- HTTP: set server timeouts, close response bodies, limit request body size, validate input. SQL: parameterized queries only, `defer rows.Close()`, check `rows.Err()`.
- No global mutable state; config from env/flags passed in explicitly.

## Verify
`go build ./...`, `go vet ./...`, `golangci-lint run` if configured, then `go test ./path/to/pkg -run TestName` (narrowest first), then `go test ./...`.
