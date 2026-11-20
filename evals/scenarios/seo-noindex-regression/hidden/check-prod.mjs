import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
fs.rmSync('dist', { recursive: true, force: true });
const r = spawnSync(process.execPath, ['deploy.mjs'], { encoding: 'utf8' });
if (r.status !== 0) { console.error('deploy failed', r.stderr); process.exit(1); }
const robots = fs.readFileSync('dist/robots.txt', 'utf8');
const html = fs.readFileSync('dist/index.html', 'utf8');
if (/^Disallow:\s*\/\s*$/m.test(robots) || /noindex/i.test(html)) { console.error('production output still blocks crawlers'); process.exit(1); }
