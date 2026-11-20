---
name: seo-structured-data
description: "Use for structured data: JSON-LD and schema.org markup, choosing types per page, generating markup from real page data, validation, and rich-result eligibility. Detects framework first. Markup must match visible content; eligibility is never guaranteed."
---

# Structured data (JSON-LD / schema.org)

Detect first: framework and where `<head>`/body markup is rendered, existing JSON-LD or microdata (including from SEO plugins and themes), CMS fields available, which pages are indexable, whether markup is generated server-side. Avoid duplicating markup already emitted by a plugin.

## Principles
- Structured data describes content that is visible on the page; markup for content users cannot see, invented ratings/reviews/prices, or misleading types violates search engine guidelines [Requirement for Google features, verify current policies].
- Valid markup does not guarantee a rich result. Features are eligibility-based, change over time, and some have been restricted or removed. Check the current official gallery of supported features and each feature's required/recommended properties before implementing; if unable to check, say it is unverified.
- Label advice **[Requirement]** (documented eligibility/policy), **[Guideline]**, or **[Practice]**, as in `seo-technical`.
- Generate JSON-LD from the same data that renders the page, escape it safely (JSON encode, `</script>` safe), never hand-copy values.
- Do not fabricate missing required fields; omit the feature and report what data is missing.

## Read when
| Concern | File |
|---|---|
| Format, @graph, ids, escaping, framework patterns | [references/json-ld-basics.md](references/json-ld-basics.md) |
| Which types for which page, restrictions, common mistakes | [references/types-by-page.md](references/types-by-page.md) |
| Validation, testing, monitoring | [references/validation-workflow.md](references/validation-workflow.md) |

Related: `seo-technical`, `seo-migration-monitoring`; framework skills for rendering details.

## Verify
Validate generated markup with the schema.org validator and the search engine's rich-result testing tool where available (these need network access; say when run), plus unit tests on the generator. Report pass/fail per page template.
