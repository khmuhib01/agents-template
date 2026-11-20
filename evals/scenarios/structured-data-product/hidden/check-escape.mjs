import { product, jsonld, renderProductPage } from './lib.mjs';
const evil = { ...product(), name: 'Mug </script><script>alert(1)</script>', description: 'a & b <i>' };
const html = renderProductPage(evil);
if (/<\/script><script>alert/i.test(html)) { console.error('JSON-LD can be broken out of with </script>'); process.exit(1); }
const { product: n } = jsonld(html);
if (!n || !String(n.name).includes('alert(1)')) { console.error('markup lost or unparsable for hostile input'); process.exit(1); }
