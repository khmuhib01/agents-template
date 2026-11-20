// Skill routing: pure functions, no I/O. Maps config (type, stack tokens, domains) to skill names using core/skill-map.json.
const toArr = (v) => (Array.isArray(v) ? v.filter((x) => x !== '') : v === '' || v === undefined || v === null ? [] : [v]);
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

// Adds the skills a skill depends on (map.deps: { skill: [skill, ...] }), transitively. Safe against cycles; unknown names are kept
// here and dropped later by the caller's `installed` filter.
export function expandDeps(deps, names) {
  const out = new Set(names);
  const queue = [...out];
  while (queue.length) {
    for (const d of toArr((deps || {})[queue.shift()])) if (!out.has(d)) { out.add(d); queue.push(d); }
  }
  return out;
}

// Skills routed for a type + stack tokens + optional domains. `installed` is the set of skill names that exist.
// Returns { focus, unmatched, unmatchedDomains }.
export function focusSkills(map, installed, type, stack, domains = []) {
  const focus = new Set(toArr(map.types[type]));
  const unmatched = [];
  for (const token of toArr(stack).map(norm)) {
    let hit = false;
    for (const [key, skills] of Object.entries(map.stack)) {
      if (token === key || (token.startsWith(key) && /^(\d*|js)$/.test(token.slice(key.length)))) { skills.forEach((x) => focus.add(x)); hit = true; }
    }
    if (!hit) unmatched.push(token);
  }
  const unmatchedDomains = [];
  const table = map.domains || {};
  for (const d of toArr(domains).map(norm)) {
    const key = Object.keys(table).find((k) => norm(k) === d);
    if (key) toArr(table[key]).forEach((x) => focus.add(x));
    else unmatchedDomains.push(d);
  }
  const all = expandDeps(map.deps, focus);
  return { focus: new Set([...all].filter((x) => installed.has(x))), unmatched, unmatchedDomains };
}

// Files inside a skill folder that exist only for maintainers and must not be installed into projects.
// `rel` is the path relative to core/skills (any separator).
export function shipsWithSkill(rel) {
  const parts = String(rel).split(/[\\/]/);
  return !parts.slice(1, -1).some((p) => p === 'evals' || p === 'examples');
}

// Overclaim check for SEO text: returns offending lines that promise rankings or guaranteed rich results without a negation.
export function claimViolations(text) {
  const bad = /(guarantee[sd]?|will rank|first page|#1 rank|top ranking)/i;
  const neg = /(never|do not|don't|no |not |without|cannot|can't)/i;
  return String(text).split(/\r?\n/).filter((l) => bad.test(l) && !neg.test(l));
}
