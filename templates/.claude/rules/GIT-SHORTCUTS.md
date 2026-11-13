# Git Shortcut Directives — {{name}}

> [!CAUTION]
> **STRICT RULE: NO AUTO-COMMIT OR AUTO-PUSH.** Never run `git commit` or `git push` on agent initiative. Changes stay uncommitted until the user runs a git shortcut below (or explicitly asks in chat).

**Branch model:** `{{branch_flow}}`. `{{branches.production}}` is protected. {{attribution_text}}

{{deploy_text}}

Never: force-push, `--no-verify`, merge a feature branch straight into `{{branches.production}}`, tag or delete branches unless asked. Verify `git remote -v` before any network operation.

---

## `/commit` [message]
1. `git status` and `git diff`.
2. Make sure no `.env`, credentials, dumps{{#if local_only_text}} or local-only paths ({{local_only_text}}){{/if}} are staged.
3. Use the given message or write a Conventional Commit (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
4. `git add <files>`, `git commit -m "<message>"`. Report SHA, message, files.

## `/push`
1. `git branch --show-current` and `git status`.
2. If on `{{branches.production}}`, warn and require explicit confirmation.
3. `git push -u origin <current-branch>`; report the result.

## `/commit-push` [message]
`/commit` followed by `/push` (halt on `{{branches.production}}` without confirmation). Runs `doc-sync` first when code changed.
{{#if branches.integration}}
## `/merge-to-dev` [message]
1. `STARTING_BRANCH=$(git branch --show-current)`; halt if it is `{{branches.integration}}` or `{{branches.production}}`.
2. Commit any changes and push the working branch.
3. `git checkout {{branches.integration}} && git pull origin {{branches.integration}}`.
4. `git merge "$STARTING_BRANCH" --no-edit`. On conflict: `git merge --abort`, return to `$STARTING_BRANCH`, report files, stop.
5. `git push origin {{branches.integration}}`, return to `$STARTING_BRANCH`, report.

## `/ship` [message]
1. Capture `STARTING_BRANCH`; commit and push uncommitted work.
2. If not on `{{branches.integration}}`: checkout, pull, merge `$STARTING_BRANCH`, push (auto-abort on conflict).
3. {{test_step}}
4. `git checkout {{branches.production}} && git pull origin {{branches.production}}`, `git merge {{branches.integration}} --no-edit` (auto-abort on conflict).
5. **Confirm once:** show `git log --oneline origin/{{branches.production}}..{{branches.production}}` and ask. Only after a yes, `git push origin {{branches.production}}`.
6. Return to `$STARTING_BRANCH` and report.

## `/merge-to-main`
The `{{branches.integration}}` → `{{branches.production}}` half of `/ship`: tests, merge, one confirmation, push, return.
{{/if}}
## `/pr`
Ensure changes are pushed, then open a PR{{#if branches.integration}} targeting `{{branches.integration}}` (never `{{branches.production}}` directly){{/if}}. Do not merge.

## `/status`
`git status --short --branch`; report changed/untracked files and ahead/behind.

## `/doc-sync` [notes]
Invoke the `doc-sync` skill to align {{docs_list}} with the changes since the last push.
