# Agents Guide & Workspace Rules

**{{name}}**{{#if url}} — {{url}}{{/if}}

{{description}}

Type: `{{type}}` · Stack: {{stack_list}}{{#if package_manager}} · Package manager: `{{package_manager}}`{{/if}}

> Generated from `project.config.yml` by claude-template `init.mjs`. Change the config and re-run init instead of editing this file by hand.

---

## 1. Fast Reference
{{layout_list}}

{{#if local_only_list}}Local-only / git-ignored (never commit):

{{local_only_list}}{{/if}}

---

## 2. Agent Execution Rules
1. **Commands:** {{exec_text}}
2. **Verification:** {{verify_text}}
3. **Deployment:** {{deploy_text}}
4. **Explicit Commit & Push Only (Strict Rule):** never commit or push on your own initiative. Changes stay in the working tree until the user issues `/commit`, `/push`, `/commit-push`{{#if branches.integration}}, `/merge-to-dev`, `/merge-to-main`, `/ship`{{/if}} (or asks in chat).
5. **Attribution:** {{attribution_text}}
6. **Branch model:** `{{branch_flow}}`. `{{branches.production}}` is protected: never commit or push to it directly.
7. **Never** force-push, use `--no-verify`, or stage secrets (`.env`, credentials, dumps).

{{#if notes_list}}### Project-specific rules

{{notes_list}}{{/if}}

Detailed rules live in `.claude/rules/` (architecture, commands & testing, docs, git shortcuts). Skills are in `.claude/skills/`; the skill routing for this project is in `.claude/CLAUDE.md`.

---

## 3. Shorthand Commands
- **`/commit [message]`**: inspect working tree, stage safely, create a Conventional Commit locally.
- **`/push`**: push the current branch to `origin` with tracking (protects `{{branches.production}}`).
- **`/commit-push [message]`**: commit and push in one step.
{{#if branches.integration}}- **`/merge-to-dev [message]`**: commit + push the working branch, merge into `{{branches.integration}}`, push it, return (auto-abort on conflict).
- **`/merge-to-main`**: tests, then `{{branches.integration}}` → `{{branches.production}}` with one confirmation before pushing.
- **`/ship [message]`**: `{{branch_flow}}` with tests and one confirmation before pushing `{{branches.production}}`.{{/if}}
- **`/pr`**: open or update a pull request without merging.
- **`/status`**, **`/sync`**: show or safely update branch state.
- **`/doc-sync [notes]`**: update {{docs_list}} to match the changes.
