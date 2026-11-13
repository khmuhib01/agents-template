---
name: typescript-development
description: "Use when writing or fixing TypeScript: types, generics, strict-mode errors, tsconfig, runtime validation (zod), or replacing `any`. Follows the project's existing tsconfig strictness."
---

# TypeScript development

Detect first: `tsconfig` (`strict`, `noUncheckedIndexedAccess`, paths), TS version, lint config, and the runtime validation library (zod, valibot, yup). Respect the existing strictness; never loosen `tsconfig` to make errors disappear.

## Rules
- No `any` in new code: use `unknown` plus narrowing, generics, or precise types. Use `as` and `!` only with a stated reason, never to silence an error.
- Model states with discriminated unions, not bags of optional fields; use exhaustive `switch` with a `never` check.
- Types are not runtime checks. Validate external data (API responses, forms, env, JSON, storage) at the boundary with the project's validator and infer types from the schema.
- Derive types (`ReturnType`, `Parameters`, `Pick`, `Omit`, `satisfies`) instead of duplicating shapes. Share API types between client and server in monorepos.
- Use `import type` for type-only imports when the project uses `isolatedModules`/`verbatimModuleSyntax`.
- Fix the cause of an error. Use `// @ts-expect-error` with an explanation only for known third-party typing bugs.

## Verify
`tsc --noEmit` (or the project's typecheck script) and lint.
