# Next.js rendering and caching

Applies to the installed Next.js major; caching defaults and APIs changed across majors (including how `fetch`, route handlers and dynamic APIs are cached, and newer caching directives). Read the official docs and upgrade guide for the installed version before relying on any default; verify with `next build && next start`.
- **Decide per route:** static (build-time), ISR/revalidated, dynamic (per request), or streamed. Use the build output's route markers to confirm; reading cookies, headers or search params can make a route dynamic.
- **Data fetching:** in Server Components or a data-access layer; deduplicate identical requests per render with the framework mechanisms; avoid waterfalls (parallelize independent fetches with `Promise.all`), use Suspense to stream slow parts.
- **Revalidation:** time-based and on-demand (`revalidatePath`, `revalidateTag`) after mutations; tag fetches/queries so invalidation is precise; remember CDN/browser caches also exist.
- **Dynamic APIs:** treat `cookies()`, `headers()`, `params`, `searchParams` per the installed version's rules (async in recent majors).
- **Client/server boundary:** client components for interactivity only; pass serializable props; keep heavy libraries out of client bundles (dynamic import).
- **Route handlers vs Server Actions:** handlers for external HTTP APIs/webhooks, actions for form/mutation flows from your own UI; both need validation and authorization.
- **Streaming and loading UI:** `loading.tsx`, Suspense boundaries, error boundaries (`error.tsx`), `not-found.tsx`.
- **Images/fonts/scripts:** `next/image` with sizes and priority for the LCP image only, `next/font`, `next/script` strategies.
- **Environment:** `NEXT_PUBLIC_*` inlined at build; runtime config via server-only env access; separate server and client modules with `server-only`.
- **Edge vs Node runtime:** edge has API limits; pick per route knowingly; database drivers and `fs` need Node.
- **Self-hosting vs platform:** cache and image-optimization behavior depend on the deployment target; check the docs for the target, including multi-instance cache handling.
- **SEO:** metadata, sitemap, robots, canonical, JSON-LD: `seo-technical` (frameworks/nextjs.md), `seo-structured-data`, `seo-web-vitals`.
