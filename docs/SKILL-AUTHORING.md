# Skill authoring guide

Rules for new and enriched skills in `core/skills/`. Enforced where possible by `node test.mjs --only "skill lint"`.

## Layout
```
core/skills/<name>/
  SKILL.md         # <= 150 lines (aim for ~80): detect first, rules, "Concern -> Read" index, verify
  references/      # one topic per file, <= ~150 lines, each starts with "Applies to: <versions>"
    SOURCES.md     # optional, official sources used (format below)
  checklists/      # short tickable lists
  examples/        # maintainer-only; NOT installed into projects (init skips examples/ and evals/ inside a skill)
```
Evals do not live inside skills: put cases in `evals/triggers/*.json` (offline) and scenarios under `evals/scenarios/` (paid, later phase).

## SKILL.md contract
- Frontmatter `name` equals the folder; `description` starts with `Use `, <= 260 chars, names triggers, says "Detects ... first" for version-sensitive skills and a short "Not for ..." clause when another skill overlaps.
- Detect the framework and installed version first; follow project conventions; prefer official docs for that version; never hardcode "latest".
- Cover failure modes, security, tests/verification and production concerns, either in the file or in a referenced file.
- Every file under `references/`, `rules/` or `checklists/` is mentioned in SKILL.md (lint).
- Actions that publish, deploy, spend money or touch production require explicit approval.
- SEO skills never promise rankings or rich results (lint).
- Do not copy documentation wholesale; keep license/author metadata when adapting licensed material.

## SOURCES.md format
| Source | Publisher | URL | Version | Verified |
|---|---|---|---|---|

Add a row only after fetching the page during the PR; `Verified` is the date. Never write a URL from memory.

## Routing
Register the skill in `core/skill-map.json`: `stack` tokens, `domains`, and `deps` (skills it needs). Every skill must be reachable (catalog test) and `bench.mjs` numbers go in the PR body.
