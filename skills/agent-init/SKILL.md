---
name: agent-init
description: Generates AGENTS.md, CLAUDE.md and .claude/ (rules, skills, agents, settings) from the project's project.config.yml using the claude-template. Triggered only by /agent-init.
disable-model-invocation: true
---

# Agent setup: init

Template folder: `${CLAUDE_PLUGIN_ROOT}`.

1. Work in the current project root. If `project.config.yml` is missing, tell the user to run `/agent-setup-scaffold` first and stop.
2. Read the config. If any line still contains `TODO`, or `name`, `type`, `stack`, `branches.working`, `branches.production` look empty, list them and ask whether to continue anyway.
3. Run: `node ${CLAUDE_PLUGIN_ROOT}/init.mjs` and show the result (created / updated / unchanged counts and any warnings).
4. If it fails, show the error lines and fix the cause in `project.config.yml` only; never edit generated files by hand.
5. After success, report in 3-4 lines: what was generated, that `.agents/` and `.codex/` links (for Antigravity/Gemini and Codex) and `.gitignore` entries were added, and that `project.config.yml` should be committed while `.claude/.init-backup/` and the mirror links are git-ignored.
6. Do NOT commit or push. Mention that a new session may be needed before the new rules and skills load.
