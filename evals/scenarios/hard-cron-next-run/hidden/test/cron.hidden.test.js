import test from 'node:test';
import assert from 'node:assert/strict';
import { nextRun } from '../src/cron.js';

for (const [expr, after, want] of [
  ["0 0 30 2 *", "2026-01-01T00:00:00Z", null],
  ["15 14 1 * 1", "2026-03-02T00:00:00Z", "2026-03-02T14:15:00.000Z"],
  ["0 */2 * * 0", "2026-03-10T00:00:00Z", "2026-03-15T00:00:00.000Z"],
  ["45 23 28-31 * *", "2027-02-27T23:45:00Z", "2027-02-28T23:45:00.000Z"],
  ["0 0 29 2 *", "2096-03-01T00:00:00Z", "2104-02-29T00:00:00.000Z"],
  ["7 7 7 7 *", "2026-07-07T07:07:00Z", "2027-07-07T07:07:00.000Z"],
]) test(`hidden ${JSON.stringify(expr)} after ${after}`, () => {
  const got = nextRun(expr, new Date(after));
  assert.equal(got === null ? null : got.toISOString(), want);
});
