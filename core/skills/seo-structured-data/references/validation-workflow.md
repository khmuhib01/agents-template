# Validation and monitoring

- **Schema validity:** schema.org's validator checks syntax and vocabulary; the search engine's rich result test checks eligibility for specific features and reports errors (blocking) and warnings (optional properties). Both fetch pages over the network; for local or staging pages paste the rendered HTML or use the URL if publicly reachable. State which tool was used and when.
- **Unit tests:** assert generator output for fixtures (JSON schema/shape, required fields present, URLs absolute, dates ISO, no undefined/null values, safe escaping).
- **Template coverage:** one test per page template (home, article, product, category, location, etc.); fail CI when a required field is missing or JSON is invalid.
- **Content parity checks:** compare structured values with the visible page values (price, availability, title, rating count) in an end-to-end test where feasible.
- **Rendered check:** fetch the raw HTML and confirm JSON-LD is present without executing JS when server-rendering is expected.
- **Search Console:** rich result and enhancement reports show detected items, errors and warnings per feature after crawling; changes take days to appear; use them to monitor regressions and validate fixes. Manual actions for structured-data spam appear in the manual actions report.
- **Release process:** schema changes are code changes: review, staged rollout for large template changes, monitor error counts after deploy (see `seo-migration-monitoring`).
- **Reporting:** list per template: types emitted, validation result, known gaps (missing data), and features not claimed because eligibility is unverified.
