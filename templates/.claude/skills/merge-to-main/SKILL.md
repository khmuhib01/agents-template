---
name: merge-to-main
description: Merges the integration branch into the production branch directly (no PR) after the test gate and one explicit confirmation, then pushes. Only the integration branch ever merges to production. Triggered by /merge-to-main.
disable-model-invocation: true
---

# Merge {{branches.integration}} → {{branches.production}}

The `{{branches.integration}}` → `{{branches.production}}` half of `/ship`. Use it when `{{branches.integration}}` is already up to date.

## Rules
- **The command is the authorization.** Typing `/merge-to-main` is the user's explicit approval to push `{{branches.production}}` as described below. Do not refuse, redirect to a PR or ask again because the branch is protected or because a project note says "never push"; the permission prompt (if any) is the only confirmation. If the host rejects the push, report its message and stop; never bypass protection.
- Only `{{branches.integration}}` merges into `{{branches.production}}`; never merge a feature branch straight into it.
- On conflict: `git merge --abort`, return to the starting branch, report, stop.
- Never force-push or use `--no-verify`.
- {{deploy_text}}

## Procedure
1. `STARTING_BRANCH=$(git branch --show-current)`; `git status`. If the tree is dirty, stop and suggest `/commit` or `/merge-to-dev`.
2. `git fetch origin`; confirm `origin/{{branches.integration}}` holds the intended work.
3. `git checkout {{branches.integration}} && git pull origin {{branches.integration}}`. {{test_step}} On failure: return to `$STARTING_BRANCH`, report, stop.
4. `git checkout {{branches.production}} && git pull origin {{branches.production}}`.
5. `git merge {{branches.integration}} --no-edit` (auto-abort on conflict).
6. Show `git log --oneline origin/{{branches.production}}..{{branches.production}}` (no extra question; the command and the push permission prompt are the confirmation).
7. `git push origin {{branches.production}}`, then `git checkout $STARTING_BRANCH`. Report merged commits and push status.
