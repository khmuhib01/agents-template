// Accepts a test file anywhere (not only test/): at least one *.test.* file or a file under test/ that calls test( or it(.
import fs from 'node:fs';
import path from 'node:path';
const out = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name.startsWith('.')) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else out.push(p); } };
walk('.');
const isTest = (f) => /\.(test|spec)\.(m?js|cjs)$/.test(f) || /(^|[\\/])(tests?|__tests__)[\\/]/.test(f);
const withCases = out.filter((f) => isTest(f) && /\.(m?js|cjs)$/.test(f) && /\b(test|it)\s*\(/.test(fs.readFileSync(f, 'utf8')));
if (!withCases.length) { console.error('no test file with test()/it() calls found'); process.exit(1); }
