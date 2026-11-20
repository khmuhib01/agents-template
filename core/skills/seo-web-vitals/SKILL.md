---
name: seo-web-vitals
description: "Use for Core Web Vitals (LCP, INP, CLS): field vs lab measurement, diagnosing and fixing slow loading, interaction delay and layout shift, with framework patterns. Measures first. General slowness or profiling: performance-engineering."
---

# Core Web Vitals

Detect first: framework and rendering mode, hosting/CDN, image/font/script pipeline, third-party scripts, existing measurement (field data via Search Console or CrUX, RUM, Lighthouse CI). Core Web Vitals are a small part of Google's page experience signals; improving them helps users, and effects on search are modest and not guaranteed. Never promise ranking gains.

## Principles
- Metric definitions, thresholds and the set of vitals are set by Google and change (INP replaced FID as the responsiveness metric; thresholds commonly cited are LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile). Verify current definitions and thresholds in the official documentation before stating them; reject advice that still treats FID as current.
- Field data (real users, 28-day CrUX/Search Console) decides pass/fail; lab data (Lighthouse, DevTools) is for diagnosis and regression checks and can disagree.
- Fix the measured bottleneck on the worst URL groups first; re-measure in field data after rollout (it lags weeks).
- Do not trade accessibility, correctness or maintainability for a metric.

## Read when
| Concern | File |
|---|---|
| Metrics, data sources, measurement setup, RUM and CI budgets | [references/metrics-measurement.md](references/metrics-measurement.md) |
| LCP, INP and CLS diagnosis and fixes | [references/fixes.md](references/fixes.md) |
| Next.js, React, Laravel, WordPress patterns | [references/framework-patterns.md](references/framework-patterns.md) |

Related: `performance-engineering` (general profiling and backend/DB), `seo-technical`, `nextjs-development`, `wordpress-development`, `frontend-engineering`.

## Report format
URL group, metric (field vs lab, percentile, date), diagnosis with evidence (trace, waterfall, element), change, measured result, residual risk. State when only lab data was available.
