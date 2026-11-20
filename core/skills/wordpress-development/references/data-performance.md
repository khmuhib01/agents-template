# WordPress data and performance

- **WP_Query:** set `posts_per_page` explicitly (avoid -1 on large sites), `no_found_rows => true` when not paginating, `fields => 'ids'` when only IDs are needed, avoid `meta_query` on unindexed meta for large tables, use taxonomies for filterable data; `update_post_meta_cache`/`update_post_term_cache` false when unused. Never run queries inside loops over posts (N+1); prime caches with `_prime_post_caches` style APIs or a single query.
- **Use APIs:** `get_posts`, `WP_Query`, `get_option`, `get_post_meta`; custom tables only when post/meta modeling is clearly wrong for the data, created with `dbDelta` and versioned migrations.
- **Caching:** object cache (`wp_cache_get/set`) with a persistent backend (Redis/Memcached) in production; transients for expiring computed data (they use the options table without a persistent cache; keep values small); page cache plugin/CDN with correct invalidation; never cache logged-in or personalized output carelessly.
- **Assets:** enqueue conditionally, defer/async scripts with the strategy API where supported, minimize third-party scripts, optimize images (WebP/AVIF per support, correct dimensions, lazy loading), avoid render-blocking fonts.
- **Autoloaded options:** keep total autoload size small; audit with WP-CLI (`wp option list --autoload=on`).
- **Database:** indexes for custom tables, cleanup of revisions/transients/orphaned meta only with backups and approval; check slow queries with Query Monitor on staging.
- **Cron/jobs:** queue heavy work (Action Scheduler if the project uses it), batch with offsets and time limits.
- **WooCommerce:** use CRUD objects/APIs rather than raw meta; HPOS (High-Performance Order Storage) compatibility declarations in plugins, verify current Woo docs; payment and webhook handling idempotent; never test with live payment credentials.
- **Multilingual and builders:** follow the plugin's APIs for translated content and builder data; do not edit serialized builder data by hand.
- **Measure first:** Query Monitor, Lighthouse/field data, server metrics; report numbers before and after.
