export function createInvoiceService(db) {
  const own = (ctx, id) => {
    const row = db.findById(id);
    return row && row.tenantId === ctx.tenantId ? row : null;
  };
  return {
    list(ctx) {
      return db.findByTenant(ctx.tenantId);
    },
    create(ctx, { customer, amount }) {
      return db.insert({ tenantId: ctx.tenantId, customer, amount, status: 'open' });
    },
    getInvoice(ctx, id) {
      return own(ctx, id);
    },
    markPaid(ctx, id) {
      const row = own(ctx, id);
      if (!row) return null;
      row.status = 'paid';
      return row;
    },
    exportCsv(ctx) {
      const lines = db.findByTenant(ctx.tenantId).map((i) => [i.id, i.customer, i.amount, i.status].join(','));
      return ['id,customer,amount,status', ...lines].join('\n');
    },
  };
}
