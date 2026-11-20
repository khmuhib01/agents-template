import fs from 'node:fs';
import { renderProductPage } from './render.mjs';
export const product = () => JSON.parse(fs.readFileSync('product.json', 'utf8'));
export function jsonld(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => JSON.parse(m[1]));
  const flat = blocks.flatMap((b) => (Array.isArray(b) ? b : b['@graph'] ? b['@graph'] : [b]));
  return { blocks, product: flat.find((n) => [].concat(n['@type']).includes('Product')) };
}
export { renderProductPage };
