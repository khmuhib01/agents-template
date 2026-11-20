# Content audits and measurement

- **Inventory:** crawl plus Search Console pages/queries plus analytics (sessions, conversions) plus backlinks (if available) into one table keyed by canonical URL; note template/type, publish/update dates, word count, status.
- **Classify each page [Practice]:** keep as is, improve (rewrite/expand/restructure), merge (combine with a stronger page and 301), redirect, remove (404/410) or noindex deliberately. Base decisions on usefulness, traffic, links, conversions and strategic value, not on one metric.
- **Cannibalization:** find queries where several URLs of the site alternate in Search Console; decide which URL owns the intent; consolidate or differentiate, update internal links and canonicals/redirects accordingly.
- **Thin/duplicate content:** near-duplicate templates, boilerplate-only pages, empty categories, tag pages with one item: consolidate, enrich or noindex; do not mass-delete without redirect/410 plan and approval.
- **Refresh workflow:** verify facts, update examples and data, improve structure and internal links, update dates honestly, resubmit via sitemap (and URL Inspection for key pages; there is no guarantee of timing).
- **Measurement:** define hypothesis, pages affected, metric (impressions, clicks, average position for target queries, conversions), baseline period and comparison window of weeks, control group of similar untouched pages if possible. Seasonality and algorithm changes confound results; report uncertainty, never causal certainty.
- **Reporting:** before/after tables with dates and data sources; include negative results.
- **Tools:** Search Console exports, analytics, crawler outputs, spreadsheets or scripts; state the tool and settings.
- **Hand-off:** editorial changes need human review; developers implement template changes with tests (see `elements-templates.md`).
