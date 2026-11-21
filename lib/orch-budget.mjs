// Budget accounting for the orchestration driver (pure, no I/O). Numbers are starting estimates, not benchmarked.
export const PROFILES = {
  tiny: { max_total_model_calls: 1, max_repair_iterations: 0, max_estimated_cost: 0.25, per_call_cap: 0.25, plan: false },
  small: { max_total_model_calls: 3, max_repair_iterations: 1, max_estimated_cost: 0.75, per_call_cap: 0.4, plan: true },
  medium: { max_total_model_calls: 5, max_repair_iterations: 1, max_estimated_cost: 2.0, per_call_cap: 0.8, plan: true },
};
export const WARN_AT = 0.7;
// What to do when a call returns no cost (provider usage unavailable). None of this is a hard spending limit: the CLI cap is checked between turns and a call can overshoot.
//   strict      stop scheduling new calls once any call's cost is unknown (spend can no longer be bounded)
//   balanced    (default) charge the per-call cap for an unknown-cost call as a conservative reservation, so the cost cap still limits the number of calls
//   best-effort count an unknown cost as 0 (the cost cap then only limits calls with a reported cost; the call-count cap still applies)
export const POLICIES = ['strict', 'balanced', 'best-effort'];
export const DEFAULT_POLICY = 'balanced';

export function newBudget(profile, overrides = {}) {
  const base = PROFILES[profile];
  if (!base) throw new Error(`unknown profile "${profile}" (tiny, small, medium)`);
  const policy = overrides.policy ?? DEFAULT_POLICY;
  if (!POLICIES.includes(policy)) throw new Error(`unknown budget policy "${policy}" (${POLICIES.join(', ')})`);
  return { profile, ...base, ...overrides, policy, calls: 0, repairs: 0, spent: 0, reserved: 0, overspend: 0, unknownCostCalls: 0, warned: false };
}

// Decides whether one more model call may be dispatched and what per-call cap to pass to the CLI.
// A cap can only be lowered here; raising it needs a new explicit value from the caller (see raiseCap).
export function authorize(b) {
  if (b.calls >= b.max_total_model_calls) return { ok: false, reason: 'call_cap', detail: `${b.calls} of ${b.max_total_model_calls} model calls used` };
  if ((b.policy ?? DEFAULT_POLICY) === 'strict' && b.unknownCostCalls > 0) return { ok: false, reason: 'usage_unknown', detail: `${b.unknownCostCalls} call(s) reported no cost and the policy is strict, so spend can no longer be bounded` };
  const remaining = Math.max(0, +(b.max_estimated_cost - b.spent - (b.reserved ?? 0)).toFixed(6));
  if (remaining <= 0) return { ok: false, reason: 'cost_cap', detail: `$${b.spent.toFixed(4)} reported${b.reserved ? ` + $${b.reserved.toFixed(4)} reserved for calls without a reported cost` : ''} of $${b.max_estimated_cost.toFixed(2)}` };
  return { ok: true, perCallUsd: Math.min(remaining, b.per_call_cap), remaining };
}

// cost: USD as a number, or null/undefined when the CLI did not report it (never estimated: `spent` is provider-reported only).
// cap: the per-call cap the call ran under. An unknown-cost call reserves it (policy balanced); a reported cost above it is recorded as overspend.
export function record(b, { cost, cap }) {
  const known = typeof cost === 'number' && Number.isFinite(cost) && cost >= 0;
  const reserve = !known && (b.policy ?? DEFAULT_POLICY) === 'balanced' && typeof cap === 'number' ? cap : 0;
  const over = known && typeof cap === 'number' && cost > cap ? +(cost - cap).toFixed(6) : 0;
  const n = { ...b, calls: b.calls + 1, spent: known ? +(b.spent + cost).toFixed(6) : b.spent, reserved: +((b.reserved ?? 0) + reserve).toFixed(6), overspend: +((b.overspend ?? 0) + over).toFixed(6), unknownCostCalls: b.unknownCostCalls + (known ? 0 : 1) };
  n.justWarned = false;
  if (!n.warned && n.spent + n.reserved >= WARN_AT * n.max_estimated_cost) { n.warned = true; n.justWarned = true; }
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
