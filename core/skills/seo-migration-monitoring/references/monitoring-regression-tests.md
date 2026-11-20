# Monitoring and automated SEO regression tests

## Monitoring
- **Search Console:** verify properties (domain property where possible), submit sitemaps, watch Page indexing, Sitemaps, Core Web Vitals, rich result enhancement, Crawl stats (hosts, response codes, average response time), manual actions and security issues. Data lags by days; compare periods carefully. The Search Console API has quotas and requires authorization: ask the user for access, never embed credentials.
- **Analytics:** organic landing pages, conversions, segmented by section/template; annotate releases and migrations; distinguish tracking breakage from real traffic loss (check tag firing first).
- **Server/log monitoring:** 4xx/5xx rates for crawler user agents, redirect volume, response time.
- **Alerts:** uptime, sudden drops in indexed pages or sitemap URLs, spike in 404s/soft 404s, robots.txt changes, certificate expiry.
- **Reporting:** weekly after launch for the first weeks, then monthly; list wins, regressions, actions with owners; never promise recovery timelines.
- **Third-party tools:** crawlers and rank trackers measure samples; state tool, date and settings.

## Automated regression tests (run in CI or on a schedule against staging/production)
1. **robots/noindex guard:** production robots.txt does not contain `Disallow: /` for the site and key templates have no `noindex`; non-production does. Fail the pipeline otherwise.
2. **Sitemap checks:** every sitemap URL returns 200, is canonical to itself, is not noindex, matches the host/protocol; count is within a tolerance band of the previous release.
3. **Canonical consistency:** key templates have a self-referencing absolute canonical; no canonical pointing to redirects/404/noindex.
4. **Redirect map test:** each old URL returns the expected single-hop permanent redirect to the expected target; no chains or loops.
5. **Status checks:** known-good URLs return 200; removed URLs return 404/410; custom 404 page returns 404 not 200.
6. **Head/content checks on raw HTML:** title and meta description present and unique per template sample, one `<h1>`, internal links present as `<a href>`, JSON-LD parses and has required fields (see `seo-structured-data`).
7. **hreflang reciprocity** where used (see the international SEO skill when available).
8. **Performance budget hooks:** LCP/CLS/INP lab thresholds as warnings, not ranking claims.
9. **Snapshots:** store header/meta snapshots per template and diff between releases; review diffs rather than auto-approving.
- Implementation: plain scripts (Node `fetch`, curl, or the project's test runner such as Playwright for rendered checks); keep fixtures of representative URLs; run against staging before production deploys; treat flaky external checks as warnings.
