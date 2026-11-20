// Static site build. Output goes to dist/.
import fs from 'node:fs';

const env = process.env.SITE_ENV || process.env.SITE_ENVIRONMENT || 'staging';
const live = env === 'production';

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/robots.txt', live
  ? 'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n'
  : 'User-agent: *\nDisallow: /\n');
fs.writeFileSync('dist/index.html', `<!doctype html><html><head><title>Example</title>${live ? '' : '<meta name="robots" content="noindex">'}</head><body><h1>Example</h1></body></html>\n`);
console.log(`built for ${env}`);
