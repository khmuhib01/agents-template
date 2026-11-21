// Completion and efficiency report text (pure). Never states a result that the ledger does not record.
const usd = (n) => `$${n.toFixed(3)}`;

export function efficiencyReport(l) {
  const b = l.budget;
  const cost = b.unknownCostCalls === b.calls && b.calls > 0
    ? 'unavailable (the CLI reported no cost)'
    : `${usd(b.spent)} actual${b.unknownCostCalls ? ` (${b.unknownCostCalls} call(s) reported no cost, so this is a lower bound)` : ''}`;
  const models = [...new Set((l.steps || []).filter((s) => s.model).map((s) => s.model))].join(', ') || 'none';
  const avoided = [];
  if (!b.plan) avoided.push('planner (tiny profile)');
  if (b.repairs === 0) avoided.push('repair call (not needed or not allowed)');
  avoided.push('parallel workers, reviewers and broader test suites (outside this slice)');
  return [
    'Efficiency report',
    `- Models used: ${models}`,
    `- Model calls: ${b.calls} of ${b.max_total_model_calls}`,
    `- Agent dispatches: ${b.calls}`,
    '- Tool calls: not reported by the CLI',
    `- Repair iterations: ${b.repairs} of ${b.max_repair_iterations}`,
    '- Context loaded: goal, plan and failing-test output only (context the CLI loads by itself is not measured)',
    `- Cost: ${cost}`,
    `- Budget used: ${usd(b.spent)} of $${b.max_estimated_cost.toFixed(2)} (calls ${b.calls}/${b.max_total_model_calls})`,
    `- Avoided work: ${avoided.join('; ')}`,
  ].join('\n');
}

export function completionReport(l) {
  const v = l.validation;
  const out = [`Task ${l.id}: ${l.state}${l.stateReason ? ` (${l.stateReason})` : ''}`, `Goal: ${l.goal}`, `Profile: ${l.profile}, branch ${l.branch}`];
  if (l.plan) out.push(`Plan: ${l.plan.summary}`, 'Acceptance criteria:', ...l.plan.acceptance_criteria.map((c) => `  - ${c}`));
  out.push(l.changedFiles && l.changedFiles.length ? `Changed files (${l.changedFiles.length}): ${l.changedFiles.map((f) => f.path).join(', ')}` : 'Changed files: none recorded');
  if (!v || !v.ran) out.push('Validation: NOT RUN' + (v && v.note ? ` (${v.note})` : '') + '. Nothing is verified; review the diff yourself.');
  else out.push(`Validation: \`${v.command}\` exited ${v.exitCode}${v.attempts > 1 ? ` after ${v.attempts} attempts` : ''}.`);
  if (l.state === 'budget_exhausted') out.push(`Stopped: ${l.stateReason}. Remaining work: ${(l.remaining || []).join(', ') || 'see ledger'}. Continue only by raising the cap explicitly: --resume ${l.id} --max-cost <larger USD>.`);
  if (l.state === 'failed' || l.state === 'blocked') out.push(`Risk: the change is on branch ${l.branch} and is not verified.`);
  out.push('', efficiencyReport(l));
  return out.join('\n');
}
