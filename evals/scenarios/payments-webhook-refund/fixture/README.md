# billing-webhooks
Receives signed payment-provider webhooks. `handleWebhook(rawBody, signature, secret, store)` returns `{ status, body? }`.
Events look like `{ "id": "evt_1", "type": "invoice.paid", "data": { "customer": "c1", "invoice": "in_1", "amount": 500 } }`.
The provider retries deliveries, so the same event id can arrive more than once.
