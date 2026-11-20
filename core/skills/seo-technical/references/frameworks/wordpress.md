# WordPress SEO implementation

Applies to: the installed WordPress version and SEO plugin (if any). Follow `wordpress-development` safety rules; do not change production settings or database content without approval.
- **Division of labor:** WordPress core provides basic sitemaps and robots handling (verify version-specific behavior); an SEO plugin (for example Yoast, Rank Math, SEOPress, All in One SEO) usually owns titles, meta descriptions, canonicals, robots meta, sitemaps and schema. Use one plugin for each of these jobs; two plugins outputting the same tags cause duplicates and conflicts.
- **Audit first:** check rendered HTML for duplicate or conflicting `<title>`, canonical and robots tags (theme + plugin + page builder), the "Discourage search engines from indexing this site" setting (Settings → Reading) left on in production, `noindex` on archives/attachments by plan, and sitemap contents.
- **Permalinks:** descriptive structure set once; changing structure needs a redirect map (see `seo-migration-monitoring`). Attachment pages, author archives, tag/date archives, and thin taxonomies: decide deliberately to index or noindex.
- **Themes/builders:** ensure heading structure and semantic HTML are not broken by builders; lazy loading and LCP image handling; avoid JS-injected content for important text.
- **Performance:** page caching, image optimization, minimal plugins, correct HTTP caching; see `wordpress-development` performance reference.
- **Multilingual (WPML, Polylang, etc.):** hreflang/URLs are produced by the plugin; verify reciprocal alternates in rendered HTML.
- **WooCommerce:** product and category canonicals, variation URLs, filters/parameters (see facets), out-of-stock policy, product schema from the plugin vs custom (avoid duplicates).
- **Redirects:** plugin or server rules; avoid chains created by combining both; log 404s and fix valuable ones.
- **Custom code:** emit tags through the plugin's filters or `wp_head` with escaping; do not hardcode static SEO values in templates.
- **Verification:** crawl staging, inspect raw HTML for key templates (home, post, page, category, product, search, 404), compare robots/sitemaps with intent.
