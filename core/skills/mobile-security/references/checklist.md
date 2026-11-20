# Mobile security review checklist

Mark each: pass / fail / not applicable / not verified.
1. Secrets: no private keys, API secrets or signing material in repo, bundle, resources, or build config.
2. Tokens: stored in Keychain/Keystore-backed storage; rotated; cleared on logout.
3. Transport: TLS everywhere; no trust-all; cleartext disabled in release; pinning decision documented.
4. Authorization: server enforces; client checks are UX only.
5. Deep links/intents: verified links, parameters validated, sensitive actions re-confirmed.
6. WebView: origin allow-list, JS bridges restricted.
7. Local data: sensitive data encrypted or minimized; excluded from backups; cleared on logout.
8. Logging/analytics/crash reports: no PII/secrets.
9. Release build: debug off, minified/obfuscated where supported, no test endpoints.
10. Dependencies/SDKs: inventoried, current, minimal permissions.
11. Permissions: minimal, requested in context, privacy disclosures match behavior.
12. Biometric/auth flows: key-bound, fallback defined.
Severity guide: Critical (remote account/data compromise), High (local/physical compromise of sensitive data or auth bypass), Medium (needs unusual conditions), Low (hardening). Always state exploitability and evidence.
