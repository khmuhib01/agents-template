const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function productJsonLd(product) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.image,
    url: product.url,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: product.currency,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: product.url,
    },
  };
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export function renderProductPage(product) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(product.name)}</title>
  <link rel="canonical" href="${esc(product.url)}">
  <script type="application/ld+json">${productJsonLd(product)}</script>
</head>
<body>
  <h1>${esc(product.name)}</h1>
  <p>${esc(product.description)}</p>
  <p>${esc(product.currency)} ${product.price.toFixed(2)} ${product.inStock ? 'In stock' : 'Out of stock'}</p>
</body>
</html>
`;
}
