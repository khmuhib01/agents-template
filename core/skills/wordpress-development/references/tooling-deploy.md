# WordPress tooling, testing and deployment

- **Local environment:** wp-env, Docker Compose, LocalWP or the project's setup; match PHP/MySQL versions to production; never develop against the production database.
- **Dependencies:** Composer for PHP libraries (scope/prefix them in distributed plugins to avoid conflicts); npm for blocks and assets; commit lock files; keep `vendor/` and `node_modules/` out of git unless the deployment model requires built assets.
- **Coding standards:** WordPress Coding Standards through PHPCS (ruleset in repo), ESLint/Prettier via `@wordpress/scripts` for JS; PHPStan with the WordPress stubs if used.
- **Testing:** PHPUnit with the WordPress test library (`WP_UnitTestCase`) for hooks, REST routes and data logic; Playwright/Cypress (or wp-env E2E tooling) for front-end flows; test activation, deactivation and uninstall; test with the oldest supported WP/PHP version in CI.
- **Config:** environment-specific constants in `wp-config.php` or environment variables; `WP_DEBUG` on locally/staging, off in production with logging to a file (`WP_DEBUG_LOG`) not displayed.
- **Deployment:** git-based or CI deploy of code only; database changes through migrations or WP-CLI scripts with backups; `wp search-replace` with `--dry-run` first and care for serialized data; flush caches after deploy; keep uploads out of git.
- **Updates:** test core/plugin updates on staging, read changelogs, snapshot before updating, roll back plan; do not auto-update major versions blindly.
- **Backups and restore:** automated offsite backups of files and database; a restore test; know RPO/RTO.
- **Multisite:** network vs site activation, switch_to_blog costs, shared tables, domain mapping, per-site options; test plugins in network context.
- **Production approvals:** deploys, DB imports, plugin installs and settings changes on a live site need explicit approval naming the environment.
