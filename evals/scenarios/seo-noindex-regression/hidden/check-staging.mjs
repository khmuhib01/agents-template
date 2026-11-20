import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
for (const env of [{}, { SITE_ENV: 'staging', SITE_ENVIRONMENT: 'staging' }, { SITE_ENV: 'preview' }]) {
  fs.rmSync('dist', { recursive: true, force: true });
  const r = spawnSync(process.execPath, ['build.mjs'], { encoding: 'utf8', env: { ...process.env, SITE_ENV: '', SITE_ENVIRONMENT: '', ...env } });
  if (r.status !== 0) { console.error('build failed', r.stderr); process.exit(1); }
  const robots = fs.readFileSync('dist/robots.txt', 'utf8');
  const html = fs.readFileSync('dist/index.html', 'utf8');
  if (!/^Disallow:\s*\/\s*$/m.test(robots) || !/noindex/i.test(html)) { console.error('non-production build no longer blocks crawlers'); process.exit(1); }
}
