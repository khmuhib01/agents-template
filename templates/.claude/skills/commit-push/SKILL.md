---
name: commit-push
description: Inspects the working tree, stages changes safely, commits with a Conventional Commit message, and pushes to origin with upstream tracking. Triggered by /commit-push or requests to commit and push together.
disable-model-invocation: true
---

# Git Commit & Push Skill

Use when the user types `/commit-push` or asks to commit and push in one step.

1. **Inspect:** `git branch --show-current`, `git status`, diff. If the tree is clean but there are unpushed commits, skip to step 5.
2. **Doc-sync (ship time):** run the `doc-sync` skill over everything since the last push (`git diff @{upstream}..HEAD` plus the working tree; no upstream → compare with `origin/{{#if branches.integration}}{{branches.integration}}{{else}}{{branches.production}}{{/if}}`). Skip if only docs/config changed or the user passed `--no-docs`.
3. **Safety:** never stage `.env`, secrets, private keys, dumps or logs{{#if local_only_text}}, or local-only paths ({{local_only_text}}){{/if}}.
4. **Commit:** use the user's message or write a Conventional Commit. {{attribution_text}}
5. **Push:** if the branch is `{{branches.production}}`, halt and ask for confirmation first (protected). Otherwise `git push -u origin <current-branch>`.
6. **Report:** hash, message, files, push status.
