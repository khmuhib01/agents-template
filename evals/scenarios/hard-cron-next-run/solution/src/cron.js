const RANGES = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];

function parseField(text, [lo, hi], isDow) {
  const out = new Set();
  for (const part of text.split(',')) {
    const m = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
    if (!m) throw new SyntaxError(`bad cron field "${text}"`);
    const step = m[2] === undefined ? 1 : Number(m[2]);
    if (step < 1) throw new SyntaxError(`bad step in "${text}"`);
    let a; let b;
    if (m[1] === '*') [a, b] = [lo, hi];
    else if (m[1].includes('-')) [a, b] = m[1].split('-').map(Number);
    else { a = Number(m[1]); b = m[2] === undefined ? a : hi; }
    if (a < lo || b > hi || a > b) throw new SyntaxError(`out of range in "${text}"`);
    for (let v = a; v <= b; v += step) out.add(isDow && v === 7 ? 0 : v);
  }
  return out;
}

export function nextRun(expr, after) {
  const f = String(expr).trim().split(/\s+/);
  if (f.length !== 5) throw new SyntaxError('a cron expression has 5 fields');
  const [minutes, hours, doms, months, dows] = f.map((t, i) => parseField(t, RANGES[i], i === 4));
  const domAny = f[2] === '*';
  const dowAny = f[4] === '*';
  const start = new Date(Math.floor(after.getTime() / 60000) * 60000 + 60000);
  const day0 = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  for (let n = 0; n < 366 * 9; n++) {
    const day = new Date(day0 + n * 86400000);
    if (!months.has(day.getUTCMonth() + 1)) continue;
    const domOk = doms.has(day.getUTCDate());
    const dowOk = dows.has(day.getUTCDay());
    const dayOk = domAny && dowAny ? true : domAny ? dowOk : dowAny ? domOk : domOk || dowOk;
    if (!dayOk) continue;
    for (const h of [...hours].sort((x, y) => x - y)) {
      for (const mi of [...minutes].sort((x, y) => x - y)) {
        const t = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, mi));
        if (t >= start) return t;
      }
    }
  }
  return null;
}
