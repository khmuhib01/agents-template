---
name: doc-sync
description: Aligns the project's tracked docs with the changes since the last push. Triggered by /doc-sync or /docs-sync, and called from /commit-push{{#if branches.integration}}, /merge-to-dev and /ship{{/if}}.
---

# Documentation Synchronization Skill

**When it runs:** only at ship time or when the user types `/doc-sync`. Never while a change is still in progress.

**Scope:** read only the diff since the last push (`git diff --stat @{upstream}..HEAD`, then targeted hunks) plus the working tree, and open only the doc sections that diff touches.

## Docs you may update
{{docs_list}}
{{#if local_only_text}}
Local-only paths ({{local_only_text}}) are never read into tracked files and never staged.
{{/if}}
## Procedure
1. Inspect `git status` and the diff since the last push.
2. Decide what a reader of the docs needs to know: setup/run steps, commands, env variable names (names only, never values), folder layout, new routes, features or behavior.
3. Update only the affected sections; keep the existing tone and tables. Write in {{docs_language}}. Do not create new doc files.
4. If nothing setup- or user-facing changed, report "No doc changes needed".
5. Report which sections were updated.
