# Payment flows

- **Flow choice:** hosted checkout (lowest PCI burden, quickest), embedded provider fields (more UI control), server-only APIs for stored payment methods. Pick the simplest that meets the UX need.
- **Server-side creation:** create the order/payment intent on the server from trusted data (price from catalog, quantity validated, currency fixed), store our order ID in provider metadata, return only the client secret/redirect URL needed.
- **Idempotency:** send an idempotency key per logical operation (order ID + attempt) on create/capture/refund calls so retries cannot double charge; store keys with request fingerprints for our own endpoints (see `api-engineering`).
- **Webhooks (inbound):** verify the signature on the raw body with the provider's method and timestamp tolerance; respond 2xx quickly then process asynchronously; dedupe by event ID; handle out-of-order and duplicate delivery (look up current state, apply only forward transitions); retry-safe handlers; log event IDs not payloads with PII; endpoint secrets per environment.
- **State machine:** explicit states (pending, requires_action, authorized, paid, failed, canceled, refunded, partially_refunded, disputed) with allowed transitions in one place; fulfillment (shipping, access grants) triggers only on the verified paid state and is itself idempotent.
- **Failure handling:** declines, 3-D Secure/authentication steps, timeouts after the provider charged (reconcile by querying the provider), network errors, user closing the tab; show clear user messages without leaking provider internals.
- **Refunds and disputes:** refund via the provider API against the original payment (full/partial), update our records from webhooks, restock/revoke access consistently; dispute (chargeback) events flagged for a human workflow with evidence deadlines.
- **Payouts and marketplaces:** connected-account flows have extra compliance and onboarding requirements; check the provider docs and involve the user before designing.
- **Currency and rounding:** minor units, provider-supported currencies, rounding rules documented, display formatting via locale APIs, no mixing currencies in totals.
- **Security:** secrets from the environment/secret manager, restricted keys with minimum permissions, no secrets in client bundles, rate limit checkout endpoints, protect against card testing (bot detection, limits).
- **Audit trail:** immutable ledger of financial events (who, what, when, provider reference), never edit history, corrections as new entries.
