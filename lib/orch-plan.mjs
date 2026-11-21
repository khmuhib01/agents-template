// Plan schema validation, JSON extraction from model text, and secret redaction (pure, no I/O).
export function extractJson(text) {
  const s = String(text || '').replace(/```(?:json)?/gi, '');
  const start = s.indexOf('{');
  if (start < 0) return { ok: false, error: 'no JSON object found' };
  for (let end = s.lastIndexOf('}'); end > start; end = s.lastIndexOf('}', end - 1)) {
    try { return { ok: true, value: JSON.parse(s.slice(start, end + 1)) }; } catch { /* try a shorter slice */ }
  }
  return { ok: false, error: 'invalid JSON' };
}

const isStr = (x) => typeof x === 'string' && x.trim() !== '';
export function validatePlan(p) {
  const errors = [];
  if (!p || typeof p !== 'object' || Array.isArray(p)) return { ok: false, errors: ['plan must be a JSON object'] };
  if (!isStr(p.summary)) errors.push('summary must be a non-empty string');
  if (!Array.isArray(p.acceptance_criteria) || !p.acceptance_criteria.length || !p.acceptance_criteria.every(isStr)) errors.push('acceptance_criteria must be a non-empty array of strings');
  if (!Array.isArray(p.steps) || !p.steps.length || !p.steps.every((s) => s && isStr(s.title) && (s.files === undefined || (Array.isArray(s.files) && s.files.every(isStr))))) errors.push('steps must be a non-empty array of { title, files? }');
  if (p.risks !== undefined && !(Array.isArray(p.risks) && p.risks.every(isStr))) errors.push('risks must be an array of strings');
  return { ok: !errors.length, errors };
}

// Keeps only known fields so extra text from the model cannot ride along into prompts or the ledger.
export const normalizePlan = (p) => ({ summary: p.summary, acceptance_criteria: p.acceptance_criteria, steps: p.steps.map((s) => ({ title: s.title, files: s.files || [] })), risks: p.risks || [] });

const SECRET = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bsk-[A-Za-z0-9_-]{16,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi,
  /\b(password|passwd|secret|token|api[_-]?key)\b\s*[:=]\s*\S+/gi,
];
export const redact = (text) => SECRET.reduce((t, re) => t.replace(re, '[redacted]'), String(text ?? ''));
export const tail = (text, n = 2000) => { const s = String(text ?? ''); return s.length > n ? '...' + s.slice(-n) : s; };
