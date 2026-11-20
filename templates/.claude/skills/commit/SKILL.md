---
name: commit
description: Inspects working tree changes, stages relevant files safely, writes a Conventional Commit message, and creates a local Git commit. Triggered by /commit or requests to commit changes.
disable-model-invocation: true
---

# Git Commit Skill

Use when the user asks to commit changes or types `/commit`. Local commit only: no push, no branch switch, no merge.

1. **Inspect:** `git status`, `git diff`, `git diff --staged`.
2. **Safety:** never stage `.env`, secrets, private keys, database dumps or runtime logs{{#if local_only_text}}, or local-only paths ({{local_only_text}}){{/if}}. Stage only changes related to the task.
3. **Message** (Conventional Commits, imperative, concise): `feat(<scope>):`, `fix(<scope>):`, `refactor(<scope>):`, `docs:`, `test:`, `chore:`. {{attribution_text}}
4. **No doc updates here:** `/commit` is a checkpoint; {{docs_list}} are synced only in `/commit-push`{{#if branches.integration}}, `/merge-to-dev` and `/ship`{{/if}}.
5. Stage the targeted files and commit. Report the hash, message and changed files.
