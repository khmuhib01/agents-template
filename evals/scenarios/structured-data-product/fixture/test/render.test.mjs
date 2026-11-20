import test from 'node:test';
import assert from 'node:assert';
import { renderProductPage } from '../render.mjs';

test('page contains the product name', () => {
  assert.match(renderProductPage({ name: 'Mug', description: 'd', price: 1, currency: 'USD', inStock: true, url: 'https://example.com/p/1' }), /<h1>Mug<\/h1>/);
});
