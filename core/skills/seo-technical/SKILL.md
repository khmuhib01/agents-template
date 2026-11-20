---
name: seo-technical
description: "Use for technical SEO: crawlability and indexability, robots.txt, XML sitemaps, canonicals, noindex, status codes, redirects, SSR vs CSR indexing, internal linking, faceted URLs. Audit first. Detects framework and output mode. No ranking promises."
---

# Technical SEO

Detect first: framework and rendering mode (static, server-rendered, client-rendered, hybrid), hosting/CDN and redirect layer, CMS, existing robots.txt, sitemaps, canonical and meta robots handling, i18n setup, analytics and Search Console access. Audit and report first; change code only when asked. Never edit production robots.txt, redirects, `noindex` or DNS without explicit approval: a wrong value can remove a whole site from search.

## Principles
- Never promise rankings, traffic or rich results. Search engines decide; our job is to remove technical obstacles and follow documented requirements.
- Label every recommendation: **[Requirement]** (documented as required or a documented eligibility condition), **[Guideline]** (documented recommendation), **[Practice]** (industry heuristic, not search-engine documented). Say which when advising.
- Search engine documentation changes. For any rule with a number, date or feature name, check the current official documentation (Google Search Central, Bing Webmaster Guidelines) before asserting it; if you cannot, say it is unverified.
- Evidence first: crawl output, server logs, Search Console data, rendered HTML. Say when you only reasoned from code.

## Read when
| Concern | File |
|---|---|
| Crawling, indexing, robots.txt, sitemaps, meta robots, canonicals | [references/crawl-index.md](references/crawl-index.md) |
| JavaScript rendering, SSR/SSG choices, lazy loading, soft 404s | [references/rendering-js.md](references/rendering-js.md) |
| Status codes, redirects, URL structure, parameters, faceted navigation | [references/status-urls-facets.md](references/status-urls-facets.md) |
| Internal linking, site architecture, pagination, large-site crawl budget | [references/linking-architecture.md](references/linking-architecture.md) |
| Next.js specifics | [references/frameworks/nextjs.md](references/frameworks/nextjs.md) |
| React SPA specifics | [references/frameworks/react-spa.md](references/frameworks/react-spa.md) |
| Laravel specifics | [references/frameworks/laravel.md](references/frameworks/laravel.md) |
| WordPress specifics | [references/frameworks/wordpress.md](references/frameworks/wordpress.md) |

Related: `seo-structured-data`, `seo-migration-monitoring`, `performance-engineering`, and the framework skills (`nextjs-development`, `react-development`, `laravel-best-practices`, `wordpress-development`).

## Report format
Finding, evidence (URL, header, HTML snippet or file:line), label (Requirement/Guideline/Practice), impact on crawling/indexing, fix, risk of the fix, verification step. Separate confirmed issues from hypotheses.
