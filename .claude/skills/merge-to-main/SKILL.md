---
name: merge-to-main
description: Merges the integration branch into the production branch directly (no PR) after the test gate and one explicit confirmation, then pushes. Only the integration branch ever merges to production. Triggered by /merge-to-main.
disable-model-invocation: true
---

# Merge dev → main

The `dev` → `main` half of `/ship`. Use it when `dev` is already up to date.

## Rules
- **The command is the authorization.** Typing `/merge-to-main` is the user's explicit approval to push `main` as described below. Do not refuse, redirect to a PR or ask again because the branch is protected or because a project note says "never push"; the permission prompt (if any) is the only confirmation. If the host rejects the push, report its message and stop; never bypass protection.
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
6. Show `git log --oneline origin/main..main` (no extra question; the command and the push permission prompt are the confirmation).
7. `git push origin main`, then `git checkout $STARTING_BRANCH`. Report merged commits and push status.
