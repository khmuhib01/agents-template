---
name: seo-migration-monitoring
description: "Use for SEO site migrations (domain, URL, replatform, HTTPS, redesign), redirect maps, launch checklists, post-launch monitoring, Search Console/analytics setup and automated SEO regression tests. Never changes production redirects or robots without approval."
---

# SEO migrations and monitoring

Detect first: what is changing (domain, URL structure, CMS/framework, design, hosting, language structure), current URL inventory, analytics and Search Console access, traffic and conversion baselines, redirect layer (CDN, web server, application), staging setup, launch window and rollback plan. Migrations are high-risk: plan, stage, test, monitor. Never apply redirects, robots, `noindex` or DNS changes to production without explicit approval.

## Principles
- No outcome promises: even a well-run migration can see temporary fluctuations; report measured changes, not predictions.
- Label recommendations **[Requirement]** / **[Guideline]** / **[Practice]** as in `seo-technical`; verify specifics (for example the Change of Address tool conditions) in current official documentation.
- Inventory before change, test on staging, compare after launch, keep the old system recoverable.

## Read when
| Concern | File |
|---|---|
| Inventory, redirect mapping, staging, launch and rollback checklists | [references/migration.md](references/migration.md) |
| Search Console, analytics, post-launch monitoring, CI regression tests | [references/monitoring-regression-tests.md](references/monitoring-regression-tests.md) |

Related: `seo-technical` (status codes, canonicals, robots), `seo-structured-data`, `framework-upgrade`, `deploy` (approval gates).

## Deliverables
Redirect map (CSV with source, target, status, rule type), launch checklist with owners, test results from staging, monitoring plan with thresholds and a rollback trigger. Report uncertainties and unverified items explicitly.
