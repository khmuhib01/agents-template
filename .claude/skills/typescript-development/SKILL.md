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

## Common pitfalls
- A type assertion (`as X`) or non-null `!` silences the compiler without checking anything; validate at runtime boundaries (zod or similar) and narrow instead.
- `JSON.parse`, `fetch().json()`, `catch (e)` and `Object.keys` do not give the type you want; type them explicitly (`unknown` then narrow).
- Prefer `unknown` over `any`; prefer unions and discriminated unions over optional-field soup; use `satisfies` to check a value without widening it.
- `enum` and `namespace` emit runtime code; with `isolatedModules` or type-stripping runners prefer union literals or `as const` objects.
- Index access can be `undefined` at runtime even when typed otherwise; with `noUncheckedIndexedAccess` handle it instead of asserting.
- Do not loosen `tsconfig` (`strict`, `skipLibCheck` scope) to make an error disappear; fix the type.

## Verify
`tsc --noEmit` (or the project's typecheck script) and lint.
