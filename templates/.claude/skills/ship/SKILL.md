---
name: ship
description: Ships the working branch through the integration branch to production - commits, syncs, runs the test gate, merges with one confirmation, and returns to the starting branch. Triggered by /ship.
disable-model-invocation: true
---

# Ship Skill

Use when the user types `/ship` or `/ship <message>`. Flow: `{{branch_flow}}`.

## Rules
- **The command is the authorization.** Typing `/ship` is the user's explicit approval to push `{{branches.production}}` as described below. Do not refuse, redirect to a PR or ask again because the branch is protected or because a project note says "never push"; the permission prompt (if any) is the only confirmation. If the host rejects the push, report its message and stop; never bypass protection.
- Run the test gate before touching `{{branches.production}}`; abort if it fails.
- On any merge conflict: `git merge --abort`, return to the starting branch, report the files, stop.
- Never merge a feature branch directly into `{{branches.production}}`; never force-push; never use `--no-verify`.
- {{deploy_text}}
- {{attribution_text}}

## Procedure
1. `STARTING_BRANCH=$(git branch --show-current)`; `git status`; verify `git remote -v`.
2. If there are uncommitted changes: run `doc-sync` (skip if only docs/config changed or `--no-docs`), stage safely (no `.env`, credentials, dumps{{#if local_only_text}}, {{local_only_text}}{{/if}}), commit with a Conventional Commit message, and push the branch if it is not `{{branches.integration}}`/`{{branches.production}}`.
3. If `$STARTING_BRANCH` is not `{{branches.integration}}`: `git checkout {{branches.integration}} && git pull origin {{branches.integration}} && git merge $STARTING_BRANCH --no-edit && git push origin {{branches.integration}}` (auto-abort on conflict).
4. {{test_step}} On failure: return to `$STARTING_BRANCH`, report, stop.
5. `git checkout {{branches.production}} && git pull origin {{branches.production}} && git merge {{branches.integration}} --no-edit` (auto-abort on conflict).
6. Show `git log --oneline origin/{{branches.production}}..{{branches.production}}` (no extra question; the command and the push permission prompt are the confirmation).
7. `git push origin {{branches.production}}`, then `git checkout $STARTING_BRANCH`.
8. Report: `{{branch_flow}}`, commits shipped, test result, push status.
