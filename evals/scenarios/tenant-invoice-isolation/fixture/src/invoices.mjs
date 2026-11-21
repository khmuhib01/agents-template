export function createInvoiceService(db) {
  return {
    list(ctx) {
      return db.findByTenant(ctx.tenantId);
    },
    create(ctx, { customer, amount }) {
      return db.insert({ tenantId: ctx.tenantId, customer, amount, status: 'open' });
    },
  };
}
