# Readiness report and launch plan

## Report template
1. **Scope and context:** what is launching, date, environments reviewed, sources of evidence, what was not reviewed.
2. **Summary and recommendation:** Go / Go with conditions / No-go, in three lines, with the top risks.
3. **Findings table:** ID, area, item, status (fail / not verified), severity (blocker / fix before launch / follow-up), evidence, recommended action, owner.
4. **Passed items:** brief list with evidence pointers.
5. **Not applicable:** items with reasons.
6. **Open questions** for the user (legal, business, operational).
7. **Residual risks** accepted knowingly (who accepted, when).

## Go / no-go criteria (adapt with the owner)
- No open blockers; security and data-loss risks resolved or explicitly accepted by the owner.
- Rollback or forward-fix path rehearsed; backups verified by restore.
- Monitoring and alerts live with an owner on call during rollout.
- Success metrics and guardrails instrumented.

## Launch plan outline
Pre-launch freeze and checklist walk-through; communication to stakeholders and support; deployment steps (executed only with the user's explicit approval for the named environment); smoke tests; staged rollout steps with hold points and metrics thresholds; who watches what and for how long; rollback triggers; post-launch review (metrics vs targets, incidents, lessons); cleanup (remove flags, close tasks, update docs and PRD status).
