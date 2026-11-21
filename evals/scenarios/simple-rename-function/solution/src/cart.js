export function calculateTotal(items) {
  return items.reduce((n, i) => n + i.price * i.qty, 0);
}
