// Orchestration task state machine (pure, no I/O). See docs/AUTONOMOUS-ORCHESTRATION.md.
export const STATES = ['queued', 'ready', 'running', 'validating', 'completed', 'blocked', 'needs_approval', 'failed', 'cancelled', 'budget_exhausted'];
export const TERMINAL = new Set(['completed', 'failed', 'cancelled']);

// from -> allowed next states. budget_exhausted is resumable (back to ready) only when the caller supplies a larger cap.
const T = {
  queued: ['ready', 'cancelled'],
  ready: ['running', 'blocked', 'cancelled', 'budget_exhausted'],
  running: ['validating', 'failed', 'blocked', 'needs_approval', 'cancelled', 'budget_exhausted'],
  validating: ['completed', 'running', 'blocked', 'failed', 'cancelled', 'budget_exhausted'],
  blocked: ['ready', 'cancelled', 'failed'],
  needs_approval: ['ready', 'cancelled', 'failed'],
  budget_exhausted: ['ready', 'cancelled'],
  completed: [],
  failed: [],
  cancelled: [],
};

export const canTransition = (from, to) => (T[from] || []).includes(to);

export function transition(ledger, to, reason = '') {
  if (!canTransition(ledger.state, to)) throw new Error(`illegal task transition ${ledger.state} -> ${to}`);
  if (to === 'completed') {
    const why = completionProblems(ledger);
    if (why.length) throw new Error(`cannot complete: ${why.join('; ')}`);
  }
  return { ...ledger, state: to, stateReason: reason, updatedAt: new Date().toISOString() };
}

// A task may only be completed with its acceptance criteria listed (unless the tiny profile skipped planning)
// and a validation record that really ran and exited 0.
export function completionProblems(ledger) {
  const p = [];
  if (ledger.profile !== 'tiny' && !(ledger.plan && ledger.plan.acceptance_criteria && ledger.plan.acceptance_criteria.length)) p.push('no acceptance criteria recorded');
  const v = ledger.validation;
  if (!v || v.ran !== true) p.push('validation did not run');
  else if (v.exitCode !== 0) p.push(`validation exit code ${v.exitCode}`);
  return p;
}
