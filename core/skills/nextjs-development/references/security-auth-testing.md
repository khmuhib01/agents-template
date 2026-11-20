# Next.js security, auth and testing

- **Server Actions and route handlers are public endpoints:** authenticate, authorize (object-level), validate input with a schema (zod/valibot or the project's), rate-limit sensitive ones, return safe errors; do not trust hidden form fields or client-provided user IDs. CSRF protections for actions follow the framework's origin checks; keep custom handlers safe with SameSite cookies and tokens where needed.
- **Auth layers:** session via the project's library (Auth.js, custom JWT/session, provider SDK); check auth in layouts/pages **and** in the data-access layer/actions; middleware/proxy is for redirects and coarse gating only. Verify the library's current guidance for your Next version.
- **Data exposure:** do not pass secrets or whole DB rows to client components; use DTOs with allow-listed fields; "taint"-style APIs or `server-only` imports reduce accidental leaks.
- **Headers:** security headers via `next.config` or middleware (CSP with nonces for inline scripts where needed, HSTS, frame-ancestors, referrer policy); validate that third-party scripts are allowed.
- **Input in URLs/redirects:** validate redirect targets (open redirect), sanitize `searchParams` use, escape output (React escapes by default; avoid `dangerouslySetInnerHTML` with unsanitized input).
- **Env and secrets:** server-only env vars, no secrets in `NEXT_PUBLIC_*`, separate preview and production secrets.
- **Dependencies:** keep Next.js and React patched; read security advisories for the installed version (see `dependency-management`, `security-audit`).
- **Testing:** unit tests for pure logic and data layer; component tests (Testing Library) for client components; async Server Components tested via integration/E2E (Playwright) since unit rendering support is limited (check the installed version's testing docs); test Server Actions as functions with mocked auth; route handlers with request mocks; E2E for auth flows and caching behavior against `next build && next start`.
- **Observability:** error boundaries plus a reporter (Sentry-class), instrumentation hook for tracing if used, structured server logs without PII.
- **Deployment:** never change hosting config or deploy without approval; confirm environment variables and build-time vs runtime behavior per target.
