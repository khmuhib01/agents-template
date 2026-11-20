# Evidence, metrics and prioritization

- **Evidence ladder (weakest to strongest):** opinion, anecdote, support tickets/feedback themes, usage analytics, user interviews or observed sessions, experiment results. Say which level supports each decision and what is missing. If the user has no data, propose the cheapest way to get some (five interviews, a log query, a fake-door or manual pilot).
- **Do not fabricate:** no invented persona statistics, quotes, market figures or competitor capabilities. Personas are hypotheses unless built from data; label them.
- **Metrics:** input metrics (activation, task completion, time to complete) and outcome metrics (retention, revenue, support load); one primary, a few supporting, one or two guardrails (performance, error rate, complaints). Define precisely: numerator, denominator, window, segment, data source. Avoid vanity metrics.
- **Baselines and targets:** state how the baseline was measured; targets are hypotheses with a review date; consider seasonality and sample size; be honest about uncertainty.
- **Prioritization:** use a simple, stated method (value vs effort, or RICE-style with stated assumptions) only to structure discussion; scores are estimates, not truth. Show the inputs so the user can challenge them.
- **Opportunity framing:** list several options with trade-offs rather than one favored solution; include the cost of delay and the cost of being wrong.
- **Ethics and privacy:** minimal personal data in research, consent for interviews/recordings, bias awareness in data and AI features, accessibility as a requirement not an extra.
- **When to stop discovering:** the riskiest assumptions have been tested or accepted knowingly, scope and success metrics are agreed, the next step is clear. Over-researching a small change is waste.
- **Handoff:** discovery brief approved by the user becomes the input to `prd-requirements`; unresolved assumptions carry over as tracked risks.
