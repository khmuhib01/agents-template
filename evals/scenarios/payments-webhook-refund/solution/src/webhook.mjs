import crypto from 'node:crypto';

export function verifySignature(rawBody, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function handleWebhook(rawBody, signature, secret, store) {
  if (!verifySignature(rawBody, signature, secret)) return { status: 400, body: 'invalid signature' };
  const event = JSON.parse(rawBody);
  switch (event.type) {
    case 'invoice.paid': {
      const { customer, invoice, amount } = event.data;
      store.invoices[invoice] = { status: 'paid', amount };
      store.balances[customer] = (store.balances[customer] || 0) + amount;
      return { status: 200 };
    }
    case 'charge.refunded': {
      if (store.hasSeen(event.id)) return { status: 200, body: 'duplicate' };
      const { customer, invoice, amount } = event.data;
      store.markSeen(event.id);
      store.invoices[invoice] = { ...(store.invoices[invoice] || {}), status: 'refunded' };
      store.balances[customer] = (store.balances[customer] || 0) - amount;
      return { status: 200 };
    }
    default:
      return { status: 200, body: 'ignored' };
  }
}
