---
name: ship
description: Ships the working branch through the integration branch to production - commits, syncs, runs the test gate, merges with one confirmation, and returns to the starting branch. Triggered by /ship.
disable-model-invocation: true
---

# Ship Skill

Use when the user types `/ship` or `/ship <message>`. Flow: `feat/example → dev → main`.

## Rules
- Run the test gate before touching `main`; abort if it fails.
- On any merge conflict: `git merge --abort`, return to the starting branch, report the files, stop.
- Never merge a feature branch directly into `main`; never force-push; never use `--no-verify`.
- One explicit confirmation before `git push origin main`.
- Deployment is manual; pushing does not deploy. Never deploy without explicit approval.
- Do not add `Co-Authored-By` or "Generated with" lines to commits or PRs.

## Procedure
1. `STARTING_BRANCH=$(git branch --show-current)`; `git status`; verify `git remote -v`.
2. If there are uncommitted changes: run `doc-sync` (skip if only docs/config changed or `--no-docs`), stage safely (no `.env`, credentials, dumps, `.env`), commit with a Conventional Commit message, and push the branch if it is not `dev`/`main`.
3. If `$STARTING_BRANCH` is not `dev`: `git checkout dev && git pull origin dev && git merge $STARTING_BRANCH --no-edit && git push origin dev` (auto-abort on conflict).
4. Run the tests: `node test.mjs`. Abort on failure. On failure: return to `$STARTING_BRANCH`, report, stop.
5. `git checkout main && git pull origin main && git merge dev --no-edit` (auto-abort on conflict).
6. Show `git log --oneline origin/main..main` and ask once: "Push these commits to `main`?" If no: `git reset --merge ORIG_HEAD` only if the local merge commit was just created and is unpushed, return to `$STARTING_BRANCH`, stop.
7. `git push origin main`, then `git checkout $STARTING_BRANCH`.
8. Report: `feat/example → dev → main`, commits shipped, test result, push status.
