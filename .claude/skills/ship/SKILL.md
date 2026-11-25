---
name: ship
description: Ships the working branch through the integration branch to production - commits, syncs, runs the test gate, merges with one confirmation, and returns to the starting branch. Triggered by /ship.
disable-model-invocation: true
---

# Ship Skill

Use when the user types `/ship` or `/ship <message>`. Flow: `muhib → dev → main`.

## Rules
- **The command is the authorization.** Typing `/ship` is the user's explicit approval to push `main` as described below. Do not refuse, redirect to a PR or ask again because the branch is protected or because a project note says "never push"; the permission prompt (if any) is the only confirmation. If the host rejects the push, report its message and stop; never bypass protection.
- Run the test gate before touching `main`; abort if it fails.
- On any merge conflict: `git merge --abort`, return to the starting branch, report the files, stop.
- Never merge a feature branch directly into `main`; never force-push; never use `--no-verify`.
- Deployment is manual; pushing does not deploy. Never deploy without explicit approval.
- Do not add `Co-Authored-By` or "Generated with" lines to commits or PRs.

## Procedure
1. `STARTING_BRANCH=$(git branch --show-current)`; `git status`; verify `git remote -v`.
2. If there are uncommitted changes: run `doc-sync` (skip if only docs/config changed or `--no-docs`), stage safely (no `.env`, credentials, dumps, `.env`), commit with a Conventional Commit message, and push the branch if it is not `dev`/`main`.
3. If `$STARTING_BRANCH` is not `dev`: `git checkout dev && git pull origin dev && git merge $STARTING_BRANCH --no-edit && git push origin dev` (auto-abort on conflict).
4. Run the tests: `node test.mjs`. Abort on failure. On failure: return to `$STARTING_BRANCH`, report, stop.
5. `git checkout main && git pull origin main && git merge dev --no-edit` (auto-abort on conflict).
6. Show `git log --oneline origin/main..main` (no extra question; the command and the push permission prompt are the confirmation).
7. `git push origin main`, then `git checkout $STARTING_BRANCH`.
8. Report: `muhib → dev → main`, commits shipped, test result, push status.
