---
name: react-development
description: "Use when building or reviewing React components, hooks, state, effects, forms, or data fetching on the web (Vite, CRA, or inside Next.js). Detects the React version and existing patterns first."
---

# React development

Detect first: React version (18 vs 19), build tool, TS or JS, styling approach, state/data libraries (TanStack Query, SWR, Redux, Zustand), test setup, and nearby component patterns. Match them; do not add a library when an installed one covers the need.

## Rules
- Compute derived values during render. Do not copy props or server data into state, or sync them with effects.
- Use effects only to synchronize with external systems (subscriptions, timers, DOM APIs, non-React widgets) and always clean up. Fetch through the project's data layer (query library or framework loader), not ad-hoc effects.
- Keep state as local as possible; lift only when shared. Use context for low-frequency values (theme, auth), not fast-changing state.
- Use stable unique keys; never the array index for reorderable lists.
- Do not add `useMemo`/`useCallback`/`memo` by default. Add them for a measured problem; omit them if the project uses React Compiler.
- Handle loading, empty, error, and success states. Use error boundaries and Suspense where the project already does.
- Forms: follow the project's form and validation library; accessible labels and error messages.
- Semantic HTML, keyboard access, visible focus. Never pass untrusted content to `dangerouslySetInnerHTML`.
- React 19 only if installed: `ref` as a regular prop, `use`, `useActionState`, `useOptimistic`, form actions. Do not use them on React 18.

## Verify
Run typecheck, lint, and tests. Prefer Testing Library queries by role/label over implementation details.
