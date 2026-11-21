---
name: merge-to-dev
description: Commits and pushes the current working branch, merges it into the integration branch, pushes it, and returns to the original branch. Auto-aborts on conflict. Triggered by /merge-to-dev.
disable-model-invocation: true
---

# Safe Merge-to-Dev Skill

Use when the user types `/merge-to-dev`. Branch model: `feat/example → dev → main`.

## Guardrails
- If the current branch is `dev`: abort with `Already on dev. Nothing to merge.`
- If the current branch is `main`: abort with `Cannot merge from main into dev.`
- On any merge conflict: `git merge --abort`, switch back to the starting branch, report the conflicting files. Never leave `dev` conflicted or dirty.
- Always push the working branch before checking out `dev`. Always return to the starting branch at the end.
- Never force-push, never use `--no-verify`.

## Procedure
1. `STARTING_BRANCH=$(git branch --show-current)`; `git status`; verify `git remote -v`.
2. If there are uncommitted changes: run `doc-sync` (skip if only docs/config changed or `--no-docs`), stage safely (no `.env`, credentials, dumps, `.env`), commit with a Conventional Commit message. Do not add `Co-Authored-By` or "Generated with" lines to commits or PRs.
3. `git push -u origin $STARTING_BRANCH`.
4. `git checkout dev && git pull origin dev`.
5. `git merge "$STARTING_BRANCH" --no-edit` (auto-abort on conflict as above).
6. `git push origin dev`, then `git checkout $STARTING_BRANCH`.
7. Report: commits merged, push status of `origin/dev`. Deployment is manual; pushing does not deploy. Never deploy without explicit approval.
