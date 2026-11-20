# WordPress architecture and hooks

Applies to: the installed WordPress version. Confirm function availability for the project's minimum WordPress version in the official developer docs.
- **Where code lives:** site-specific behavior in a custom plugin or must-use plugin; presentation in the theme (child theme if the parent is third-party). Not in `functions.php` of a parent theme, never in core.
- **Plugin skeleton:** main file header, `ABSPATH` guard, namespaced classes with an autoloader (Composer or manual), `register_activation_hook`/`register_deactivation_hook`, `uninstall.php` for cleanup, a single bootstrap hooked to `plugins_loaded`/`init`.
- **Hooks:** actions for events, filters for data; choose the correct hook and priority (`init` for registering post types/taxonomies, `wp_enqueue_scripts`, `admin_init`, `rest_api_init`, `template_redirect`); remove or unhook with the same callback and priority; do not do heavy work on `init` for every request.
- **Custom post types/taxonomies:** register on `init` with explicit `show_in_rest`, rewrite settings, capabilities; flush rewrite rules only on activation, not every request.
- **Templates:** template hierarchy; classic themes use `get_template_part`; block themes use `theme.json`, templates and parts in HTML; do not mix paradigms without reason. Use `wp_get_attachment_image` for images (srcset, lazy loading).
- **Blocks:** `block.json` metadata, server-side render only when needed, `@wordpress/scripts` build; keep attributes serializable; version block markup changes with deprecations.
- **REST API:** `register_rest_route` with `permission_callback`, argument schemas with `validate_callback`/`sanitize_callback`, return `WP_REST_Response`/`WP_Error` with proper status codes.
- **AJAX:** prefer REST; `admin-ajax` handlers check nonce and capability and exit properly.
- **Settings/options:** Settings API, autoload off for large options, no secrets in plain options when avoidable.
- **Cron:** WP-Cron is request-triggered; use a real system cron calling `wp cron event run --due-now` for reliability on production sites; make jobs idempotent.
- **i18n:** `load_plugin_textdomain`/theme textdomain (automatic in newer versions, verify), `__()`/`_n()`, translators comments.
- **WP-CLI:** custom commands with `WP_CLI::add_command`; use for migrations, imports, search-replace (with `--dry-run` first).
