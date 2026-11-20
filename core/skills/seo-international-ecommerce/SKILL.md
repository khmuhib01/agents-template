---
name: seo-international-ecommerce
description: "Use for international SEO (hreflang, locale URLs, language targeting), e-commerce indexing (catalog variants, categories, facets, stock status) and programmatic or template landing pages at scale. No ranking promises; avoid thin pages."
---

# International, e-commerce and programmatic SEO

Detect first: markets and languages, locale URL structure (subdirectory, subdomain, ccTLD), translation workflow, platform (Shopify, WooCommerce, Magento, custom, Next.js, Laravel), catalog size and variant model, faceted navigation, feeds, how pages are generated at scale. Audit first; do not mass-publish, redirect or noindex pages without approval.

## Principles
- Never promise rankings or rich results. Search engines decide; correctness of signals and page usefulness are in our control.
- Label advice **[Requirement]** / **[Guideline]** / **[Practice]** as in `seo-technical`; verify specifics (hreflang syntax, Merchant listing requirements, spam policies on scaled content) in current official documentation.
- Scale multiplies mistakes: test templates on samples, ship in stages, monitor indexing per section.
- Every indexable page needs unique value for a real user need; pages generated only to capture query variations are doorway/scaled-content risk [Requirement, verify current policy].

## Read when
| Concern | File |
|---|---|
| hreflang, locale URLs, language/region targeting, translation quality | [references/hreflang-locale.md](references/hreflang-locale.md) |
| Product, variant, category and facet indexing, stock, feeds, product markup | [references/ecommerce-indexing.md](references/ecommerce-indexing.md) |
| Programmatic and template pages, quality gates, rollout | [references/programmatic-seo.md](references/programmatic-seo.md) |

Related: `seo-technical` (canonicals, facets basics), `seo-structured-data` (Product/Offer markup), `seo-on-page-content`, `seo-migration-monitoring` (regression tests), `payments-billing` and catalog work in the e-commerce platform's own skill when present.

## Report format
Affected locale/section, evidence (URL samples, rendered tags), label, fix, risk, verification (crawl check, Search Console report). Separate confirmed errors from hypotheses.
