# Attack surface and transport

- **Deep links / universal links / app links:** prefer verified HTTPS links over custom URL schemes (schemes can be claimed by other apps); treat every parameter as untrusted; never perform sensitive actions from a link without re-authentication/confirmation; avoid open redirects.
- **Android components/IPC:** `exported` flags, permission-protected components, explicit intents, immutable PendingIntents, content provider path/permission checks.
- **iOS surface:** URL scheme handlers, universal link handling, pasteboard, app extensions and shared containers, entitlements kept minimal.
- **WebView:** load only trusted origins, disable JS/file access if unneeded, no JS bridges to untrusted pages, handle navigation allow-lists, no credentials in URLs; prefer system browser for third-party content.
- **Transport:** TLS only (App Transport Security / network security config not weakened); validate certificates normally; pinning optional, high-maintenance (backup pins, expiry plan, kill switch); no custom trust-all managers, ever.
- **Reverse engineering:** minification/obfuscation helps little against determined attackers; do not store secrets; tamper detection is a signal reported to the server, not a gate.
- **Debug leftovers:** debuggable flag off, no test menus, no verbose HTTP logging, no permissive CORS-like toggles in release builds.
- **Third-party SDKs:** inventory, minimum permissions, version pinning, vulnerability monitoring, privacy manifest/data-safety alignment.
- **Platform integrity APIs** (Play Integrity, App Attest): server-verified signals with graceful degradation.
