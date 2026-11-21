---
name: merge-to-main
description: Merges the integration branch into the production branch directly (no PR) after the test gate and one explicit confirmation, then pushes. Only the integration branch ever merges to production. Triggered by /merge-to-main.
disable-model-invocation: true
---

# Merge dev → main

The `dev` → `main` half of `/ship`. Use it when `dev` is already up to date.

## Rules
- Only `dev` merges into `main`; never merge a feature branch straight into it.
- On conflict: `git merge --abort`, return to the starting branch, report, stop.
- Never force-push or use `--no-verify`.
- Deployment is manual; pushing does not deploy. Never deploy without explicit approval.

## Procedure
1. `STARTING_BRANCH=$(git branch --show-current)`; `git status`. If the tree is dirty, stop and suggest `/commit` or `/merge-to-dev`.
2. `git fetch origin`; confirm `origin/dev` holds the intended work.
3. `git checkout dev && git pull origin dev`. Run the tests: `node test.mjs`. Abort on failure. On failure: return to `$STARTING_BRANCH`, report, stop.
4. `git checkout main && git pull origin main`.
5. `git merge dev --no-edit` (auto-abort on conflict).
6. Show `git log --oneline origin/main..main` and ask: "Push these commits to `main`?" If no: `git reset --merge ORIG_HEAD` (only if the local merge commit was just created and is unpushed), return, stop.
7. `git push origin main`, then `git checkout $STARTING_BRANCH`. Report merged commits and push status.
