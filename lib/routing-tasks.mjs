// Task complexity, model choice and agent selection. Pure, deterministic, no model call: the classifier must never cost more than it saves.
// It is a heuristic on the goal text (and an optional file count), not an understanding of the task; --profile / --model always win.
const has = (text, words) => words.some((w) => w.test(text));
const COMPLEX = [/\b(security|vulnerab|auth(entication|orization)?|oauth|permission|rbac|csrf|xss|inject|secret|credential|encrypt|payment|billing|refund|webhook)/i, /\b(architect|redesign|re-?architect|migrat|infrastructure|production|multi-?tenant|schema change|breaking change|rewrite)/i];
const ARCH = /\b(architect|redesign|re-?architect|boundar|restructure the|monolith|microservice)/i;
const SECURITY = COMPLEX[0];
const SIMPLE = [/\b(typo|spelling|format|lint|rename|comment|readme|docs?|documentation|explain|what does|why does|describe|summari[sz]e|changelog)\b/i];
const MEDIUM_HINT = [/\b(add|implement|build|create|endpoint|api|component|feature|refactor|database|table|query|model|test)\b/i];

export const LEVELS = ['simple', 'medium', 'complex'];

export function classifyTask(goal, { files } = {}) {
  const text = String(goal || '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const reasons = [];
  if (has(text, COMPLEX)) reasons.push('security/architecture/migration/production keyword');
  if (typeof files === 'number' && files >= 8) reasons.push(`${files} files`);
  if (words > 120) reasons.push('long goal');
  if (reasons.length) return { level: 'complex', reasons };
  if (typeof files === 'number' && files >= 2) return { level: 'medium', reasons: [`${files} files`] };
  if (has(text, SIMPLE) && !has(text, MEDIUM_HINT) && words <= 40) return { level: 'simple', reasons: ['small documentation/format/explain style task'] };
  if (words <= 12 && !has(text, MEDIUM_HINT)) return { level: 'simple', reasons: ['very short goal'] };
  return { level: 'medium', reasons: ['default'] };
}

// Orchestration profile (budget size) that matches a level.
export const PROFILE_FOR = { simple: 'tiny', medium: 'small', complex: 'medium' };

// Which agents are worth running. Empty = execute directly. Security review and architect depend on the goal text, not only on the level.
export function selectAgents(goal, level) {
  const text = String(goal || '');
  const out = [];
  if (level === 'simple') return out;
  if (level === 'complex') out.push('planner');
  if (level === 'complex' && has(text, [ARCH])) out.push('architect');
  if (has(text, [SECURITY])) out.push('security-reviewer');
  if (level === 'complex') out.push('code-reviewer');
  return out;
}

// Model choice. Precedence: explicit --model, then the project's model_routing for the level, then the default. Never changes what the user picked.
// routing: { enabled, simple, medium, complex, fallback } with plain model ids/aliases from the project config (no ids are built in).
export function resolveModel({ explicit, routing, level, fallbackDefault }) {
  if (explicit) return { model: explicit, source: 'explicit --model', fallback: routing?.fallback || null };
  const r = routing && routing.enabled === true ? routing : null; // opt-in: nothing is routed unless enabled: true
  if (r && r[level]) return { model: String(r[level]), source: `model_routing.${level}`, fallback: r.fallback ? String(r.fallback) : null };
  return { model: fallbackDefault, source: 'default', fallback: null };
}

export function routingProblems(routing) {
  if (routing === undefined || routing === null) return [];
  if (typeof routing !== 'object' || Array.isArray(routing)) return ['model_routing must be a map (enabled, simple, medium, complex, fallback)'];
  const out = [];
  for (const k of Object.keys(routing)) if (!['enabled', 'simple', 'medium', 'complex', 'fallback'].includes(k)) out.push(`model_routing.${k} is not a known key (enabled, simple, medium, complex, fallback)`);
  for (const k of [...LEVELS, 'fallback']) {
    const v = routing[k];
    if (v !== undefined && v !== '' && !/^[\w.:/-]{1,100}$/.test(String(v))) out.push(`model_routing.${k} must be a plain model id or alias (letters, digits, _ . : / -), got "${v}"`);
  }
  if (routing.enabled !== undefined && typeof routing.enabled !== 'boolean') out.push('model_routing.enabled must be true or false');
  return out;
}
