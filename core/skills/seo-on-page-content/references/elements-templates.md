# On-page elements and templates

- **Title (`<title>`):** unique per page, describes the page accurately, primary topic first where natural, brand suffix consistent. Search engines may rewrite titles; about 50-60 characters / roughly 600 pixels is a display heuristic [Practice]. Do not repeat the keyword or stack separators.
- **Meta description:** not a ranking input; may be used as the snippet. Write a concise summary with a reason to click; unique per page; engines may replace it. Missing is acceptable for pages where generated snippets are better, but templates should provide defaults.
- **Headings:** one `<h1>` describing the page topic (multiple h1 are valid HTML5 but keep structure clear), logical h2/h3 hierarchy for sections, not for styling. Headings should reflect content questions.
- **Body content:** descriptive text in HTML (not only in images or scripts), scannable structure, tables/lists where they help, answer the main question early.
- **Internal links:** descriptive anchor text, links in main content where relevant, from high-authority pages to important ones, no generic "click here"; fix links to redirected URLs. Template-level link modules (related content, hubs) need rules to avoid link spam.
- **Images:** descriptive filenames, meaningful `alt` text (describe the image's function; empty alt for decorative images), width/height set, modern formats, captions where useful; image sitemaps optional.
- **URLs:** short, descriptive, stable (see `seo-technical`).
- **Open Graph/Twitter cards:** `og:title`, `og:description`, `og:image` for sharing; these are for social platforms, not ranking.
- **Templates in code:** build title/description/heading templates per content type from fields (name, category, location), with fallbacks, length trimming at word boundaries, escaping, and tests that render samples and assert uniqueness, non-emptiness and no placeholder leakage.
- **Pagination/sorting variants:** titles indicate page numbers; avoid duplicate titles across filter combinations (see facets in `seo-technical`).
- **Accessibility overlap:** semantic headings, alt text, link text benefit users and are checked by accessibility reviews.
