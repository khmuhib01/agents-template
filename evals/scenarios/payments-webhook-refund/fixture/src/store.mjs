// In-memory stand-in for the database.
export function createStore() {
  return {
    balances: {},
    invoices: {},
    seen: new Set(),
    hasSeen(id) { return this.seen.has(id); },
    markSeen(id) { this.seen.add(id); },
  };
}
