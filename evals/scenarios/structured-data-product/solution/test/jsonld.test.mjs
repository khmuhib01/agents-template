import test from 'node:test';
import assert from 'node:assert';
import { productJsonLd } from '../render.mjs';

const p = { sku: 'S', name: 'Mug', description: 'd', price: 12.5, currency: 'USD', inStock: true, image: 'https://example.com/i.jpg', url: 'https://example.com/p/s' };

test('offer matches data', () => {
  const j = JSON.parse(productJsonLd(p));
  assert.strictEqual(j.offers.price, '12.50');
  assert.strictEqual(j.offers.availability, 'https://schema.org/InStock');
});
test('no rating without reviews', () => assert.ok(!('aggregateRating' in JSON.parse(productJsonLd(p)))));
test('hostile text cannot close the script tag', () => assert.ok(!productJsonLd({ ...p, name: '</script><script>x' }).includes('</script>')));
