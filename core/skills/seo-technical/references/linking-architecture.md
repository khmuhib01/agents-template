# Internal linking, architecture and crawl budget

- **Principles [Practice]:** important pages are reachable within a few clicks from the homepage via normal links; every indexable page has at least one internal link (no orphans); anchor text describes the target; navigation, breadcrumbs, related-content modules and in-content links all contribute.
- **Audit steps:** crawl from the homepage; compare crawled URLs with the sitemap and analytics/log data to find orphans and unreachable pages; measure click depth; find links to redirected/404/noindex URLs; find pages with too few or too many outgoing links; check nofollow use (use `rel` values `nofollow`, `sponsored`, `ugc` as documented for their purposes).
- **Breadcrumbs:** visible breadcrumb trail with real links; structured data for breadcrumbs is in `seo-structured-data`.
- **Site architecture:** group content in topical hubs with clear parent-child URL/link structure; avoid keyword cannibalization by mapping each primary intent to one page (see on-page SEO guidance when available).
- **Pagination and infinite scroll:** crawlable paginated URLs behind "load more".
- **Crawl budget:** [Guideline] mainly matters for very large (hundreds of thousands of URLs or more) or rapidly changing sites; for most sites, fix quality, duplicates and server speed first. Levers: remove or consolidate low-value URL spaces (parameters, calendars, internal search), fast and stable server responses, accurate sitemaps, no soft 404s, no redirect chains, correct `304`/caching headers.
- **Log file analysis:** parse server logs for crawler user agents (verify bots via reverse DNS or published IP lists, since user agent strings can be spoofed): which URLs are crawled, status codes returned to bots, crawl frequency, wasted crawl on parameters and redirects. Use read-only copies of logs and keep personal data out of reports.
- **Internal search pages:** usually keep out of the index (noindex or disallow, deliberately) unless curated.
- **Site speed and server health:** reliable TTFB and uptime improve crawl efficiency; see performance skills.
- **Reporting:** priorities by effect on important URL sets (templates, sections) rather than single URLs.
