# WordPress security

- **Escape late:** `esc_html()`, `esc_attr()`, `esc_url()`, `esc_js()`, `esc_textarea()`, `wp_kses_post()`/`wp_kses()` with an allow-list for rich HTML; escape at the point of output, according to context. Translation helpers have escaping variants (`esc_html__`, `esc_attr_e`).
- **Sanitize input:** `sanitize_text_field`, `sanitize_email`, `absint`, `sanitize_key`, `wp_unslash` before sanitizing superglobals; validate against allow-lists; sanitize on save, escape on output (both).
- **Nonces:** create with `wp_nonce_field`/`wp_create_nonce`, verify with `check_admin_referer`, `check_ajax_referer`, `wp_verify_nonce` for state-changing requests. A nonce proves intent, not authorization.
- **Capabilities:** `current_user_can( 'manage_options' )` (or a more specific capability) before any privileged action, including in AJAX/REST handlers; never rely on `is_admin()`.
- **SQL:** `$wpdb->prepare()` with placeholders; `$wpdb->insert/update/delete` helpers; `esc_like` for LIKE patterns; prefix via `$wpdb->prefix`.
- **File handling:** `wp_handle_upload`, check file type with `wp_check_filetype_and_ext`, never trust client MIME or name; no direct file includes from input; `ABSPATH` guard in every PHP file.
- **REST/AJAX exposure:** every endpoint has an auth check; avoid leaking user enumeration (`/wp-json/wp/v2/users`) when the site policy requires it (configure deliberately).
- **Passwords/secrets:** use core APIs; API keys in `wp-config.php` constants or environment, not in the database or theme files; `wp-config.php` outside web root when possible.
- **Hardening basics (site level):** keep core/plugins/themes updated, remove unused plugins/themes, strong admin credentials with 2FA, limit login attempts, disable file editing (`DISALLOW_FILE_EDIT`), correct file permissions, HTTPS, security headers, backups tested for restore.
- **Third-party risk:** vet plugins (maintenance, active installs, vulnerability history); prefer fewer plugins. Do not install or update plugins on production without approval.
- **Reviews:** report findings in the `security-audit` format with evidence; do not exploit sites you do not own or are not authorized to test.
