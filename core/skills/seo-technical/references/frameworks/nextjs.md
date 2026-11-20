# Next.js SEO implementation

Applies to: the installed Next.js version and router (App Router vs Pages Router). APIs differ by version; read the installed version's documentation before writing code.
- **Rendering:** prefer static generation or server rendering for indexable routes; check the rendering mode per route (build output) rather than assuming. Client-only fetched content is not in the initial HTML.
- **Metadata (App Router):** the Metadata API (`metadata` export / `generateMetadata`) sets title, description, canonical (`alternates.canonical`), robots, Open Graph, alternates. Use a metadata base so relative URLs resolve to absolute ones. Pages Router: `next/head` or the project's SEO helper. Keep one source for titles to avoid duplicates; make `generateMetadata` fetches cached/deduplicated.
- **Sitemap and robots:** file conventions (`app/sitemap.*`, `app/robots.*`) or the project's package; generate from the same data source as pages; split large sitemaps; exclude noindex, redirected and non-canonical URLs.
- **Status codes:** use `notFound()`/the not-found convention to return real 404s; use `redirect()`/`permanentRedirect()` or `redirects` in config for 307/308 semantics (check which status codes each produces in your version, since 308 vs 301 handling is documented by Google as equivalent but verify).
- **Dynamic routes:** `generateStaticParams` for known pages; decide behavior for unknown params (404 vs on-demand render) and avoid indexable infinite URL spaces.
- **Caching/revalidation:** ensure updated content reaches HTML (revalidation tags/time) and sitemaps `lastmod` reflects real changes.
- **Middleware/proxy:** do not rewrite/redirect crawlers differently; avoid locale redirects that hide alternates; keep `X-Robots-Tag` consistent.
- **Images and fonts:** `next/image` with width/height or fill, priority for the LCP image, `next/font` to reduce layout shift (see web-vitals guidance).
- **Preview/staging:** ensure `noindex` is applied through environment configuration and removed (not left) in production builds; add a test.
- **Structured data:** render JSON-LD in the server component output; see `seo-structured-data`.
- **Verify:** build, then `curl` key routes for title, canonical, robots, links and JSON-LD in raw HTML.
