// Tiny template engine: {{key}}, {{a.b}}, {{#if key}}...{{else}}...{{/if}} (no nested if).
export const missing = new Set();
const get = (ctx, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);
export const truthy = (v) => (Array.isArray(v) ? v.length > 0 : !(v === undefined || v === null || v === false || v === '' || v === 'false'));
export function render(tpl, ctx) {
  tpl = tpl.replace(/\{\{#if ([\w.]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, k, a, b) => (truthy(get(ctx, k)) ? a : (b || '')));
  tpl = tpl.replace(/\{\{([\w.]+)\}\}/g, (m, k) => {
    const v = get(ctx, k);
    if (v === undefined) { missing.add(k); return m; }
    return Array.isArray(v) ? v.join(', ') : String(v);
  });
  return tpl.replace(/\n{3,}/g, '\n\n');
}
