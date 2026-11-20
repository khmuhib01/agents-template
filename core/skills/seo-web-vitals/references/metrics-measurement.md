# Metrics and measurement

Verify definitions and thresholds in current official documentation (web.dev / Chrome and Search Console help) before quoting them.
- **LCP (Largest Contentful Paint):** time until the largest visible content element (often hero image, heading block or video poster) renders. **INP (Interaction to Next Paint):** responsiveness across all interactions in a visit (high percentile of interaction latency: input delay + processing + presentation). **CLS (Cumulative Layout Shift):** unexpected layout movement score. Supporting diagnostics: TTFB, FCP, TBT (lab proxy for responsiveness), long tasks.
- **Field data sources:** Search Console Core Web Vitals report (URL groups, 28-day window), CrUX (BigQuery/API/dashboards, origin- and URL-level when enough traffic), your own RUM with the `web-vitals` library sending `LCP/INP/CLS` plus attribution (element, interaction target, shift sources) to analytics. RUM shows segments (device, country, route) CrUX hides.
- **Lab tools:** Lighthouse (note: reports TBT, not INP, in lab), Chrome DevTools Performance panel (interactions track, layout shifts, LCP element), WebPageTest, PageSpeed Insights (combines CrUX field data with a lab run). Test on throttled mobile profile; results vary run to run; use medians of several runs.
- **Segmentation:** mobile vs desktop, route/template, new vs returning, logged-in vs anonymous, geography; fix the worst high-traffic segment first.
- **Budgets in CI:** Lighthouse CI or similar with thresholds for LCP, CLS, TBT, bundle size as regression guards (warnings first, then failures once stable); document that lab budgets approximate, not equal, field results.
- **Rollout validation:** compare field metrics before/after across equal-length windows; CrUX lags; use RUM for faster feedback; keep a change log with dates.
- **Caveats:** low-traffic URLs lack CrUX data (fall back to origin or group data); metrics can be influenced by extensions, consent banners, A/B tests and ad slots; bots and prerender traffic skew RUM; attribute properly.
- **Reporting:** show distribution (p75 plus share good/needs improvement/poor), not a single average.
