---
name: merge-to-dev
description: Commits and pushes the current working branch, merges it into the integration branch, pushes it, and returns to the original branch. Auto-aborts on conflict. Triggered by /merge-to-dev.
disable-model-invocation: true
---

# Safe Merge-to-Dev Skill

Use when the user types `/merge-to-dev`. Branch model: `{{branch_flow}}`.

## Guardrails
- If the current branch is `{{branches.integration}}`: abort with `Already on {{branches.integration}}. Nothing to merge.`
- If the current branch is `{{branches.production}}`: abort with `Cannot merge from {{branches.production}} into {{branches.integration}}.`
- On any merge conflict: `git merge --abort`, switch back to the starting branch, report the conflicting files. Never leave `{{branches.integration}}` conflicted or dirty.
- Always push the working branch before checking out `{{branches.integration}}`. Always return to the starting branch at the end.
- Never force-push, never use `--no-verify`.

## Procedure
1. `STARTING_BRANCH=$(git branch --show-current)`; `git status`; verify `git remote -v`.
2. If there are uncommitted changes: run `doc-sync` (skip if only docs/config changed or `--no-docs`), stage safely (no `.env`, credentials, dumps{{#if local_only_text}}, {{local_only_text}}{{/if}}), commit with a Conventional Commit message. {{attribution_text}}
3. `git push -u origin $STARTING_BRANCH`.
4. `git checkout {{branches.integration}} && git pull origin {{branches.integration}}`.
5. `git merge "$STARTING_BRANCH" --no-edit` (auto-abort on conflict as above).
6. `git push origin {{branches.integration}}`, then `git checkout $STARTING_BRANCH`.
7. Report: commits merged, push status of `origin/{{branches.integration}}`. {{deploy_text}}
