// Budget accounting for the orchestration driver (pure, no I/O). Numbers are starting estimates, not benchmarked.
export const PROFILES = {
  tiny: { max_total_model_calls: 1, max_repair_iterations: 0, max_estimated_cost: 0.25, per_call_cap: 0.25, plan: false },
  small: { max_total_model_calls: 3, max_repair_iterations: 1, max_estimated_cost: 0.75, per_call_cap: 0.4, plan: true },
  medium: { max_total_model_calls: 5, max_repair_iterations: 1, max_estimated_cost: 2.0, per_call_cap: 0.8, plan: true },
};
export const WARN_AT = 0.7;

export function newBudget(profile, overrides = {}) {
  const base = PROFILES[profile];
  if (!base) throw new Error(`unknown profile "${profile}" (tiny, small, medium)`);
  return { profile, ...base, ...overrides, calls: 0, repairs: 0, spent: 0, unknownCostCalls: 0, warned: false };
}

// Decides whether one more model call may be dispatched and what per-call cap to pass to the CLI.
// A cap can only be lowered here; raising it needs a new explicit value from the caller (see raiseCap).
export function authorize(b) {
  if (b.calls >= b.max_total_model_calls) return { ok: false, reason: 'call_cap', detail: `${b.calls} of ${b.max_total_model_calls} model calls used` };
  const remaining = Math.max(0, +(b.max_estimated_cost - b.spent).toFixed(6));
  if (remaining <= 0) return { ok: false, reason: 'cost_cap', detail: `spent $${b.spent.toFixed(4)} of $${b.max_estimated_cost.toFixed(2)}` };
  return { ok: true, perCallUsd: Math.min(remaining, b.per_call_cap), remaining };
}

// cost: USD as a number, or null/undefined when the CLI did not report it (never estimated here).
export function record(b, { cost }) {
  const known = typeof cost === 'number' && Number.isFinite(cost) && cost >= 0;
  const n = { ...b, calls: b.calls + 1, spent: known ? +(b.spent + cost).toFixed(6) : b.spent, unknownCostCalls: b.unknownCostCalls + (known ? 0 : 1) };
  n.justWarned = false;
  if (!n.warned && n.spent >= WARN_AT * n.max_estimated_cost) { n.warned = true; n.justWarned = true; }
  return n;
}

export const canRepair = (b) => b.repairs < b.max_repair_iterations;
export const noteRepair = (b) => ({ ...b, repairs: b.repairs + 1 });

// Only a strictly larger value is accepted; workers never call this, only the CLI flag on resume does. The per-call cap scales with it:
// the CLI checks a per-call cap only between turns, so a call stopped at the old cap would otherwise stop again at the same point.
export function raiseCap(b, newCap) {
  if (!(typeof newCap === 'number' && newCap > b.max_estimated_cost)) throw new Error(`new cost cap must be larger than $${b.max_estimated_cost}`);
  return { ...b, max_estimated_cost: newCap, per_call_cap: +(b.per_call_cap * (newCap / b.max_estimated_cost)).toFixed(4), warned: false };
}
