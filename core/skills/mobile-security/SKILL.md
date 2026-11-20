---
name: mobile-security
description: "Use for mobile app security review or implementation: secure storage, token handling, deep-link validation, transport security, WebView, logging/privacy, reverse-engineering limits. Authorized, non-destructive; platform specifics in the framework skills."
---

# Mobile security

Authorized and non-destructive only: review the app's own code, never attack third-party apps or live backends, never print or exfiltrate secrets. Detect first: platforms, auth model (OAuth/OIDC, session tokens), storage libraries, WebViews, deep links, analytics SDKs, backend API security assumptions.

## Principles
- The device and the app binary are untrusted. Anything shipped in the bundle is public: API keys that grant privilege, signing secrets and "hidden" endpoints are not secrets. Authorization is enforced on the server.
- Store the minimum; encrypt what is sensitive with platform key stores (Keychain / Keystore); keep tokens short-lived with refresh, and revoke on logout.
- Obfuscation, root/jailbreak detection and certificate pinning raise attacker cost but are not controls you can rely on; state this honestly and add pinning only with a rotation/rollback plan.
- Privacy is a security property: collect less, disclose accurately (store privacy forms, consent), keep PII out of logs, analytics and crash reports.

## Read when
| Concern | File |
|---|---|
| Storage, tokens, biometrics, backups, logging, clipboard/screenshots | [references/data-and-auth.md](references/data-and-auth.md) |
| Deep links, intents, URL schemes, WebView, IPC, transport, pinning | [references/surface-and-transport.md](references/surface-and-transport.md) |
| Review checklist and severity template | [references/checklist.md](references/checklist.md) |

Platform detail: `android-kotlin-development` (security.md), `swift-development`, `flutter-development`, `react-native-development`. Server-side issues go to `security-audit` and `api-engineering`.

## Report format
Finding, evidence (file:line), severity and exploitability, affected platform, fix, and whether confirmed or only potential. Do not claim compliance with a standard without mapping each control to evidence.
