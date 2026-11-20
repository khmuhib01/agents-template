# Android security

See also the `mobile-security` skill for platform-agnostic policy.
- **Storage:** secrets and tokens in Keystore-backed encryption. Check the maintenance status of any wrapper library (for example Jetpack Security crypto) before adding it; prefer directly using Keystore with AES-GCM or a maintained library the project already has. Never log secrets. Disable cloud backup for sensitive files (`allowBackup`, backup/data-extraction rules).
- **Network:** HTTPS only; `networkSecurityConfig` with cleartext disabled for release; certificate pinning is a trade-off (outage risk on rotation) and is added only when required, with backup pins and a rollback plan.
- **Components:** set `android:exported` deliberately; protect exported components with permissions; use explicit intents; `PendingIntent.FLAG_IMMUTABLE` unless mutation is needed; validate deep-link parameters; never trust intent extras.
- **WebView:** disable JavaScript and file access unless needed; restrict navigation to allowed origins; do not expose `addJavascriptInterface` to untrusted content.
- **Build hardening:** R8 minify and shrink for release, tested keep rules; no debug flags or test endpoints in release; no secrets in `BuildConfig` or resources (they are extractable). Signing keys stay out of the repo (use Play App Signing and CI secrets).
- **Play Integrity:** an attestation signal verified on the server, not a client-side gate; plan for false positives.
- **Biometrics:** use BiometricPrompt with a crypto-object-bound key when protecting data; fall back per policy.
- **Dependency risk:** run dependency vulnerability checks if the project has them; pin versions via the catalog.
