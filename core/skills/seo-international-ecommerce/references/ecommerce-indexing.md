# E-commerce indexing

- **Page types and intent:** category/listing pages target commercial research intent; product pages transactional; guides/comparison content informational. Each indexable page needs a unique title, description, headings and content beyond a manufacturer blurb where possible.
- **Products and variants:** choose one canonical product URL per product; variants (color/size) either share the parent URL with selectors (parameters or fragments not indexed) or have separate indexable URLs only when they have distinct search demand and content; canonical other variant URLs to the main one; keep `Offer`/availability data accurate per variant (see `seo-structured-data`).
- **Categories and facets:** index facet combinations only when they match real demand and have unique content; control crawl of the rest (see `seo-technical` status-urls-facets reference); breadcrumbs consistent with one canonical category path per product (products reachable via many paths should canonicalize).
- **Pagination and sorting:** crawlable page links, self-canonicals, no indexable sort/filter permutations.
- **Out of stock / discontinued [Practice]:** temporarily out of stock: keep the page, show availability and alternatives, correct `availability` markup; permanently gone with a close replacement: 301 to the replacement or category; no replacement: 404/410 (avoid soft 404s).
- **Product data quality:** accurate price/currency/availability consistent between page, structured data and feeds; unique descriptions, images with alt text, reviews only if genuine and displayed.
- **Merchant feeds and listings:** product feeds (Merchant Center and similar) are separate from organic SEO signals but must match on-page data; check current program requirements before claiming eligibility.
- **Internal search pages:** keep out of the index unless curated landing pages exist.
- **Faceted URL hygiene:** stable parameter order, lowercase, no session IDs, no duplicate paths.
- **Performance:** product listing and PDP Core Web Vitals (`seo-web-vitals`): image sizing, lazy loading, third-party scripts (reviews, chat, tag managers).
- **Platform notes:** Shopify/WooCommerce/Magento ship default duplicate paths (collections/products URLs, tag pages, parameters); audit canonical behavior in rendered HTML rather than trusting defaults.
- **Seasonal and sale pages:** reuse stable URLs year to year and update content instead of creating new URLs each time.
- **Checkout/cart/account:** noindex or blocked; never in sitemaps.
