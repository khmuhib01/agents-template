# React single-page app SEO

- **First decision:** does this content need to be indexed? App areas behind login do not. For public content, a client-rendered React app is the highest-risk option: choose pre-rendering at build time (static export or prerender tooling), server rendering via a framework (Next.js, Remix and similar), or a separate server-rendered marketing site.
- **Routing:** `BrowserRouter`/History API with real paths, not hash routes; server must return the app shell for deep links but real 404 for unknown routes (configure the host/CDN fallback carefully; a blanket "all paths return 200 index.html" creates soft 404s).
- **Head management:** per-route title, description, canonical, robots via a head library or framework API; verify values exist in the prerendered/server HTML, not only after hydration.
- **Links:** use router `<Link>` that renders `<a href>`; no `onClick`-only navigation.
- **Data fetching:** fetch before render for indexable content (loader/SSR/prerender) so content is in HTML.
- **Sitemap/robots:** generate at build time from route/data lists, serve as static files.
- **Meta tags for social previews** (Open Graph) need server/prerendered HTML because most social scrapers do not run JS.
- **Performance:** code splitting by route, avoid shipping large bundles that delay rendering; see `performance-engineering`.
- **Testing:** fetch raw HTML with `curl` and compare with the rendered DOM; run a headless browser check for rendered content; add route-level assertions in CI.
- **Migration path:** if retrofitting SEO into an existing SPA, start with prerendering the public routes and a routing/404 fix before deeper changes.
