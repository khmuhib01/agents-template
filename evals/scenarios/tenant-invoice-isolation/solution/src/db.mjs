// In-memory stand-in for the invoices table (ids are global across tenants).
export function createDb(rows = []) {
  return {
    invoices: rows,
    findById(id) { return this.invoices.find((i) => i.id === id) || null; },
    findByTenant(tenantId) { return this.invoices.filter((i) => i.tenantId === tenantId); },
    insert(row) { const r = { id: this.invoices.length + 1, ...row }; this.invoices.push(r); return r; },
  };
}
