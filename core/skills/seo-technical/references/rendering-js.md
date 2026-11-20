# Rendering and JavaScript SEO

- **Principle:** [Guideline] Content and links that matter should be present in the HTML a crawler receives or reliably after rendering. Google renders JavaScript but with delay and limits; other crawlers may not render. Server rendering or static generation is the lower-risk choice for indexable pages [Practice].
- **Check what the crawler sees:** fetch the raw HTML (`curl`), compare with the rendered DOM (browser, URL Inspection "rendered HTML"), confirm title, meta robots, canonical, main content, internal links, structured data exist in the version that counts.
- **Links:** [Guideline] use real `<a href>` links with crawlable URLs; click handlers, `javascript:` hrefs and buttons are not reliable links. Avoid hash-fragment routing for indexable pages; use the History API with real paths.
- **Meta/head management:** set title, meta description, canonical and robots per route on the server or at build time; client-side changes after load are riskier. Do not rely on JS to flip `noindex` to `index`.
- **Lazy loading:** content that loads only on scroll or interaction may not be seen; use native `loading="lazy"` for images below the fold, avoid lazy-loading the main (LCP) image; infinite scroll needs paginated, linkable URLs.
- **Rendering modes:** SSG/ISR for mostly static content, SSR for personalized or frequently changing pages, CSR only for non-indexable app areas. Dynamic rendering (serving different HTML to bots) is a workaround, not a recommended long-term setup [Guideline, verify].
- **Errors in rendering:** blocked JS/CSS/API in robots.txt, runtime errors, timeouts, requests requiring cookies or user interaction, content behind permission prompts.
- **Status codes in SPAs:** real 404/410/5xx statuses from the server for missing pages; a 200 with a "not found" message is a soft 404. Client-side redirects are weaker than HTTP redirects.
- **Hydration mismatches** can change content between server and client; keep critical content consistent.
- **Performance link:** slow rendering delays indexing; see `seo-web-vitals` when available, or `performance-engineering`.
- **Testing:** automated checks that key routes return expected title/canonical/robots/links in raw HTML (see `seo-migration-monitoring` regression tests).
