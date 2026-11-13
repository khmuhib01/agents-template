# Architecture Rules — {{name}}

Type `{{type}}`; stack: {{stack_list}}.

Before changing structure, inspect the repository and follow the patterns already used nearby (`/project-intelligence` maps an unfamiliar area). Do not introduce a new framework, layer or package manager without asking.

## Layout
{{layout_list}}

{{#if notes_list}}## Project-specific rules

{{notes_list}}{{/if}}

## General guardrails
- Match the installed framework and language versions; check manifests/lockfiles before using newer-only features.
- Keep business rules in one place; do not duplicate them across UI, API, jobs and persistence.
- Never edit an already-deployed migration; add a new timestamped one.
- Enforce authorization on the server; validate input at trust boundaries.
