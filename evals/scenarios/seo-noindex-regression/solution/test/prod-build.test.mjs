import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

test('production deploy build is indexable', () => {
  fs.rmSync('dist', { recursive: true, force: true });
  assert.strictEqual(spawnSync(process.execPath, ['deploy.mjs']).status, 0);
  assert.doesNotMatch(fs.readFileSync('dist/robots.txt', 'utf8'), /^Disallow:\s*\/\s*$/m);
  assert.doesNotMatch(fs.readFileSync('dist/index.html', 'utf8'), /noindex/i);
});
