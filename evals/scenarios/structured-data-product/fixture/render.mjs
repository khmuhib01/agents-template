const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderProductPage(product) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(product.name)}</title>
  <link rel="canonical" href="${esc(product.url)}">
</head>
<body>
  <h1>${esc(product.name)}</h1>
  <p>${esc(product.description)}</p>
  <p>${esc(product.currency)} ${product.price.toFixed(2)} ${product.inStock ? 'In stock' : 'Out of stock'}</p>
</body>
</html>
`;
}
