export function calcTotal(items) {
  return items.reduce((n, i) => n + i.price * i.qty, 0);
}
