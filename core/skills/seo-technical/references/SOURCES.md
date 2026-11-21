# Sources

Official documentation this skill's guidance should be checked against. Rows are added only after the URL was fetched and the version noted. Pages marked "no version shown" print no date or version, so the Verified date is the fetch date, not a revision date. Anything under "Not yet verified" is still unverified against current docs; read the official docs for the installed version.

| Source | Publisher | URL | Version | Verified |
|---|---|---|---|---|
| Robots.txt Introduction and Guide | Google Search Central | https://developers.google.com/search/docs/crawling-indexing/robots/intro | no version shown | 2026-11-21 |
| What Is a Sitemap | Google Search Central | https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview | no version shown | 2026-11-21 |
| What is canonicalization | Google Search Central | https://developers.google.com/search/docs/crawling-indexing/canonicalization | no version shown | 2026-11-21 |
| Understand the JavaScript SEO basics | Google Search Central | https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics | no version shown | 2026-11-21 |
| RFC 9309: Robots Exclusion Protocol | RFC Editor (IETF) | https://www.rfc-editor.org/rfc/rfc9309 | Proposed Standard, September 2022 | 2026-11-21 |
| Build and submit a sitemap | Google Search Central | https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap | no version shown | 2026-11-21 |
| Dynamic rendering as a workaround | Google Search Central | https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering | no version shown | 2026-11-21 |

## Checked against the fetched pages
- robots.txt-blocked URLs can still appear without a description (robots intro): matches `crawl-index.md`.
- RFC 9309 gives a minimum parsing limit of 500 kibibytes for crawlers, not a file-size cap.
- Sitemap limits are 50 MB uncompressed or 50,000 URLs per file, larger sets must be split (optionally with a sitemap index): matches `crawl-index.md`.
- Google states it ignores `<priority>` and `<changefreq>` and uses `<lastmod>` only when it is consistently and verifiably accurate: consistent with `crawl-index.md` ("largely ignored", accurate `lastmod`).
- Dynamic rendering is "a workaround and not a recommended solution"; Google recommends server-side rendering, static rendering or hydration: matches `rendering-js.md`.

## Not yet verified
- Bing Webmaster Guidelines: the page loaded but returned no usable content.
- Next.js, Laravel, WordPress docs for the APIs named in frameworks/
