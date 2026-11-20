# Laravel SEO implementation

Applies to: the installed Laravel version; follow `laravel-best-practices` conventions and the existing view layer (Blade, Livewire, Inertia).
- **Server-rendered by default:** Blade output is crawlable. With Inertia/Vue/React front ends, verify server-side rendering is enabled for public pages (Inertia SSR) or public pages are plain Blade.
- **Head tags:** a Blade layout with sections/stack for title, description, canonical, robots; a small view-composer or presenter provides defaults, pages override. Escape all dynamic values (Blade `{{ }}`).
- **Canonical and URL hygiene:** middleware or route-level redirects to one host/protocol and trailing-slash policy; use named routes and absolute URLs (`route()` with `URL::forceRootUrl`/`APP_URL` correct behind proxies: configure trusted proxies so generated URLs use https).
- **Slugs:** stable unique slugs stored in the database; when a slug changes, keep a redirect from the old slug (a redirects table checked by middleware, returning 301). Route model binding with slugs.
- **Status codes:** `abort(404)` / `ModelNotFoundException` produce 404 pages; return 410 for deliberately removed content; do not render a 200 "not found" view.
- **Sitemap:** generate from models (a scheduled command writing static files or a cached controller); chunk to protocol limits; include only canonical public URLs; `lastmod` from `updated_at` only when content changes meaningfully. A package is optional; if the project already uses one, follow it.
- **robots.txt:** static file or route per environment; non-production environments return `Disallow: /` and authentication, production must not (add a test).
- **Pagination:** `paginate()` URLs with `?page=`, self-canonical per page, keep links crawlable (`links()` renders anchors).
- **Performance:** response caching for public pages, eager loading, image sizes, compression/HTTP caching headers.
- **Structured data:** JSON-LD partials rendered from the same model data; see `seo-structured-data`.
- **Tests:** feature tests asserting title, canonical, robots meta, 404/301 behavior and sitemap contents for key routes.
