# Sources

Official documentation this skill's guidance should be checked against. Rows are added only after the URL was fetched and the version noted. Pages marked "no version shown" print no date or version, so the Verified date is the fetch date, not a revision date. Anything under "Not yet verified" is still unverified against current docs; read the official docs for the installed version.

| Source | Publisher | URL | Version | Verified |
|---|---|---|---|---|
| Receive Stripe events in your webhook endpoint | Stripe | https://docs.stripe.com/webhooks | no page date shown | 2026-11-21 |
| Build a payments page | Stripe | https://docs.stripe.com/payments/checkout | no page date shown | 2026-11-21 |
| PCI SSC Document Library (hub page) | PCI Security Standards Council | https://www.pcisecuritystandards.org/document_library/ | lists PCI DSS v4.0.1; document table did not load | 2026-11-21 |

## Checked against the fetched pages
- Stripe webhooks: verify signatures, endpoints may receive the same event more than once, log processed event IDs: matches the idempotency and signature rules in the skill.

## Not yet verified
- PCI SAQ documents: the document list on the PCI page did not load, so SAQ types are **not** verified.
- Tax authority guidance is jurisdiction-specific and was not fetched.
- Other payment providers were not fetched.
