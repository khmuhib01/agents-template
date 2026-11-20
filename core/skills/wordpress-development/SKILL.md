---
name: wordpress-development
description: "Use for WordPress themes, plugins, blocks, hooks, REST endpoints, WP_Query, WP-CLI and security (escaping, nonces, capabilities). Detects WordPress/PHP versions, theme type and plugins first. Never edits production or live databases."
---

# WordPress development

Detect first: WordPress and PHP versions, classic theme vs block (FSE) theme vs child theme, page builder (Elementor etc.), key plugins (WooCommerce, ACF, SEO and cache plugins, multilingual), multisite, build tooling (`@wordpress/scripts`, Vite), coding standard (WordPress Coding Standards via PHPCS), and how the site is deployed. Follow existing conventions; prefer core APIs over custom SQL or new plugins; ask before adding plugins.

## Hard rules
- Do not modify production files or databases, WordPress core, or third-party plugin/theme code. Customize through a child theme, a custom plugin or hooks. Use a local or staging copy; back up before any bulk database change and ask first.
- Sanitize input, validate, escape output late, check nonces for state changes, check capabilities for privileged actions, and use `$wpdb->prepare()` for SQL with variables.
- Prefix functions, classes, hooks, options and handles (or use namespaces); never rely on globals leaking.
- Enqueue scripts/styles with the enqueue APIs, never hardcode tags; load assets only where needed.
- Every REST route has a real `permission_callback`.
- Use the text domain for all user-facing strings (internationalization) and escape them with the `esc_html__`-style helpers.

## Read when
| Concern | File |
|---|---|
| Plugin/theme/block structure, hooks, templates, REST, WP-CLI | [references/architecture-hooks.md](references/architecture-hooks.md) |
| Escaping, sanitizing, nonces, capabilities, uploads, updates | [references/security.md](references/security.md) |
| WP_Query, options/transients, object cache, performance, WooCommerce | [references/data-performance.md](references/data-performance.md) |
| Local dev, testing, deployment, backups, multisite | [references/tooling-deploy.md](references/tooling-deploy.md) |

General PHP: `php-development`. SEO for WordPress sites: the SEO skills' WordPress reference when SEO work is in scope. Security review format: `security-audit`.

## Verify
`php -l` on changed files, PHPCS with the project's ruleset, plugin/theme tests (PHPUnit with the WordPress test suite or Playwright/Cypress for the front end) if present, `wp` commands on a local/staging site only. State which checks could not run.
