import { product, jsonld, renderProductPage } from './lib.mjs';
const { product: n } = jsonld(renderProductPage(product()));
if (!n) { console.error('no Product JSON-LD found'); process.exit(1); }
if ('aggregateRating' in n || 'review' in n) { console.error('rating/review markup emitted for a product with no reviews'); process.exit(1); }
