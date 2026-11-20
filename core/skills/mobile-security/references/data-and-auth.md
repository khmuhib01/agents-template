# Data protection and authentication

Reference points: OWASP MASVS/MASTG are the usual mobile verification standards. Check their current versions and control names before citing them; do not quote from memory.

- **Token storage:** access/refresh tokens in Keychain (iOS) or Keystore-backed encrypted storage (Android) via the framework's secure-storage wrapper; never in plain SharedPreferences/AsyncStorage/UserDefaults/files. Verify the wrapper library is maintained.
- **Token handling:** short-lived access tokens, rotating refresh tokens, single-flight refresh, clear on logout and on refresh failure, no tokens in URLs, logs or analytics.
- **OAuth/OIDC:** system browser (ASWebAuthenticationSession / Custom Tabs) with PKCE, not embedded WebViews; validate `state`; register redirect URIs strictly.
- **Biometrics:** gate access to a Keystore/Keychain key (crypto-bound), not just a boolean UI check; define fallback and enrollment-change behavior.
- **Local data:** encrypt sensitive databases/files when the threat model needs it (lost device); exclude secrets from cloud/device backups; clear caches on logout; avoid sensitive data in screenshots (app switcher snapshot), clipboard and keyboard caches (secure text fields).
- **Logging and telemetry:** no PII or secrets in logs, crash reports, analytics events or URLs; scrub in release; review SDK data collection against the privacy disclosure.
- **Input and storage injection:** parameterized SQL, validate data from deep links, push payloads and files.
- **Secrets in the bundle:** keys that must exist client-side should be restricted (platform/package/bundle ID, quotas, scopes) and rotatable; anything else moves server-side.
- **Account lifecycle:** deletion flow and data export where store policy or law requires; flag legal questions to the user rather than answering them.
