---
name: nextjs-development
description: "Use for Next.js work: App Router or Pages Router, server/client components, routing, server actions, route handlers, caching, middleware, metadata, and build or deploy errors. Detects the installed Next.js version first."
---

# Next.js development

Detect first: `next` and `react` versions, App Router (`app/`) vs Pages Router (`pages/`) or both, TS, auth and data libraries, deployment target. Caching defaults and request APIs changed between majors: read the official docs or upgrade guide for the installed major before using version-sensitive APIs.

## Rules
- App Router components are Server Components by default. Add `"use client"` only to the smallest leaf that needs state, effects, or browser APIs; pass server data down as props.
- Fetch data in Server Components or the data layer. Do not call your own route handler from a Server Component.
- Next 15+: `cookies()`, `headers()`, `params`, and `searchParams` are async; await them. Do not assume fetch or route-handler caching defaults; set caching explicitly (`cache`, `revalidate`, tags) when behavior matters.
- Server Actions are public HTTP endpoints: validate input on the server and authenticate and authorize inside every action.
- Never rely on middleware alone for authorization; check again in the data or route layer.
- Only `NEXT_PUBLIC_*` variables reach the browser; never put secrets there. Keep server-only code out of client components (`server-only` package).
- Use `next/image`, `next/font`, `next/link`, and the Metadata API instead of hand-rolled equivalents.
- Add `loading`, `error`, and `not-found` files for segments with async data. Keep pages static when the data allows; reading cookies or headers makes a route dynamic.
- Pages Router projects: keep `getServerSideProps`/`getStaticProps`; do not migrate to App Router unprompted.

## Verify
`next build` (types, lint, static/dynamic route report), then project tests. Do not deploy or change hosting config without approval.
