# Choosing types by page

Always confirm the current supported-features list and required properties in the official documentation; feature availability, eligibility and display change over time. The notes below are orientation, not a spec.
- **Site-wide:** `Organization` (name, url, logo, sameAs profiles that are real), `WebSite` (name; a sitelinks search box feature has been withdrawn by Google, verify before adding SearchAction for that purpose).
- **Articles/blog:** `Article`/`NewsArticle`/`BlogPosting` with headline, image, datePublished, dateModified (only when really modified), author (`Person`/`Organization` with a real page).
- **Breadcrumbs:** `BreadcrumbList` mirroring the visible breadcrumb trail.
- **Products:** `Product` with name, image, description, `offers` (`Offer` with price, priceCurrency, availability, url) matching the visible page and checkout; identifiers (`gtin`, `sku`, `brand`) only if real. Variants and merchant-listing features have additional rules; verify current requirements. Do not mark up a category listing as a single product.
- **Reviews and ratings:** only genuine, visible, user-provided reviews about the item on that page; self-serving ratings for your own organization/local business pages are restricted for rich results by Google (verify); never invent `aggregateRating`/`review` values.
- **Local business:** `LocalBusiness` subtype with real NAP, opening hours, geo; must match the visible and Business Profile data.
- **Events, jobs, recipes, videos, courses, software apps:** each has its own documented required properties and policies; use only when the page really is that thing, and validate.
- **FAQ and HowTo:** Google has restricted or removed rich results for these in recent years (FAQ rich results limited to certain authoritative sites; HowTo rich results discontinued, verify current status). The markup may remain valid schema.org but do not promise a visual benefit; add only when the content is a genuine FAQ visible on the page.
- **Q&A, discussion forums, paywalled content:** have specific markup rules (for example `isAccessibleForFree`); check docs.
- **Common mistakes:** markup not matching visible content, missing required properties, wrong currency/price formats, marking up all pages with the same generic block, stale `dateModified`, blocked images, markup on noindex pages (pointless), duplicate conflicting blocks from plugin and theme.
- **Out of scope:** promising rich results, rankings or click-through gains.
