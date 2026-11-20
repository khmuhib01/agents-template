---
name: payments-billing
description: "Use for payment integration and subscription billing: checkout, webhooks, idempotency, subscription state, invoices, refunds, proration, dunning, reconciliation. Provider-agnostic. Test mode only; never charges live accounts or handles raw card data."
---

# Payments and billing

Detect first: payment provider and SDK version, integration style (hosted checkout, embedded elements, server-side API), billing model (one-off, subscription, usage-based, seats), existing order/subscription tables, webhook handling, currencies, tax handling, refund and dispute process. Follow the provider's current official documentation for the installed SDK; do not reproduce API details from memory.

## Hard rules
- Use test/sandbox credentials only. Never create live charges, refunds, payouts or customers, and never print API keys, without explicit approval naming the environment.
- Never receive, log or store raw card numbers or CVC: use the provider's hosted fields/checkout so card data never touches our servers (keeps PCI scope minimal; confirm requirements with the user and provider docs).
- The server decides prices and amounts; never trust client-sent amounts, currency or plan IDs without checking.
- Money is stored as integer minor units plus ISO 4217 currency (or exact decimals), never floats.
- Every state change from the provider arrives by verified, idempotent webhook handling; the success redirect alone does not prove payment.
- Tax, invoicing and consumer-protection rules vary by jurisdiction: flag them to the user, do not assert legal compliance.

## Read when
| Concern | File |
|---|---|
| Checkout flow, webhooks, idempotency, state machines, refunds and disputes | [references/payments-flow.md](references/payments-flow.md) |
| Subscriptions, plans, trials, proration, usage billing, dunning, entitlements, reconciliation, testing | [references/subscriptions-ops.md](references/subscriptions-ops.md) |

Related: `api-engineering` (webhooks, idempotency), `security-audit`, `database-engineering` (money and migrations), `saas-multitenancy`, `event-driven-architecture`.

## Verify
Test with provider test mode and its webhook simulation or CLI; tests for duplicate, out-of-order and replayed webhooks; no secrets in logs; state which paths were not exercised.
