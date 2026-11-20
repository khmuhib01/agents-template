# Subscriptions, usage billing and operations

- **Model:** products/plans/prices (catalog) separate from customers and subscriptions; subscription states (trialing, active, past_due, canceled, paused) mirrored from the provider via webhooks, with our entitlements derived from state, not from client claims.
- **Trials and changes:** trial end behavior, payment method collection, upgrades/downgrades (immediate vs end of period), proration rules from the provider (understand them; test amounts), cancel at period end vs immediate, reactivation, seat quantity changes.
- **Usage-based billing:** record usage events idempotently with timestamps and tenant, aggregate per billing period, report to the provider with deduplication, show usage to customers, handle late events and corrections.
- **Dunning:** failed payment retry schedule (provider smart retries or our own), customer emails with update-payment link, grace period and access policy (soft restrict before cutoff), final cancellation, win-back; keep messaging accurate and policy approved by the user.
- **Entitlements:** a single function answers "can tenant X use feature Y now" from plan, add-ons, status, grace; cached with invalidation on subscription events; fail safe on provider outage (documented default).
- **Invoices and tax:** use provider invoicing/tax features where suitable; jurisdiction rules (VAT/GST/sales tax, invoice numbering, B2B reverse charge) are the user's/accountant's decision, flag unknowns; store invoice PDFs/links and customer billing details.
- **Reconciliation:** daily job compares provider balance/transactions with our ledger, reports mismatches (missing webhook, refund not recorded), idempotent repair with approval; monitor webhook failures and delivery lag.
- **Testing:** provider test clocks or simulated time for renewals/trials where available, webhook replay/duplicate/out-of-order tests, proration expectation tests with fixed numbers, failure card scenarios from provider test data, entitlement tests per state.
- **Migration between plans or providers:** dual-write/shadow period, mapping tables, no customer double billing, rollback plan; never migrate live customers without approval.
- **Metrics:** MRR, churn, failed payment rate, recovery rate, webhook error rate, refund rate; define precisely with the user before reporting.
- **Data protection:** minimal customer billing data, retention policy, access controls, audit logs for staff actions.
