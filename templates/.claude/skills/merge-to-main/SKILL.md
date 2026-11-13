---
name: merge-to-main
description: Merges the integration branch into the production branch directly (no PR) after the test gate and one explicit confirmation, then pushes. Only the integration branch ever merges to production. Triggered by /merge-to-main.
---

# Merge {{branches.integration}} → {{branches.production}}

The `{{branches.integration}}` → `{{branches.production}}` half of `/ship`. Use it when `{{branches.integration}}` is already up to date.

## Rules
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
6. Show `git log --oneline origin/{{branches.production}}..{{branches.production}}` and ask: "Push these commits to `{{branches.production}}`?" If no: `git reset --merge ORIG_HEAD` (only if the local merge commit was just created and is unpushed), return, stop.
7. `git push origin {{branches.production}}`, then `git checkout $STARTING_BRANCH`. Report merged commits and push status.
