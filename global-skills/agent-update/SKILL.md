---
name: agent-update
description: Updates the current project to the latest agents-template. Compares the project's installed template version with the template, shows what changed, dry-runs, asks, then regenerates. Triggered only by /agent-update.
disable-model-invocation: true
---

# Agent setup: update

Template folder: `__TEMPLATE_DIR__`.

1. Work in the current project root. If `project.config.yml` is missing, tell the user to run `/agent-setup-scaffold` first and stop.
2. Get the template up to date:
   - If `__TEMPLATE_DIR__/.git` exists, run `git -C __TEMPLATE_DIR__ pull --ff-only` and show the result. If it fails (local changes, offline), say so and continue with the local copy.
   - Otherwise (plugin install) skip this step and tell the user that the plugin itself is updated with `claude plugin update agents-template@agents-template`.
3. Compare versions: read `.claude/.template-version` in the project (missing means never generated; suggest `/agent-init` and stop) and `__TEMPLATE_DIR__/VERSION`. If they are equal, say the project is up to date and stop.
4. Read `__TEMPLATE_DIR__/CHANGELOG.md` and list, in at most 8 short lines, the entries newer than the project's version. Flag anything that needs a config change (new keys, renamed stack tokens, notes saying "existing projects keep...").
5. Run `node __TEMPLATE_DIR__/init.mjs --dry-run` and summarize: created / updated / unchanged counts, the version line (`old -> new`) and any warnings. If there is a warning about unmatched stack tokens, propose the fix in `project.config.yml` (spelling, or move to `domains`) but do not edit without asking.
6. Ask the user to confirm. On yes, run `node __TEMPLATE_DIR__/init.mjs` and show the result. Changed files are backed up by init in `.claude/.init-backup/<timestamp>/`; mention that path.
7. If it fails, show the error lines and fix the cause in `project.config.yml` only; never edit generated files by hand.
8. Report in 3-4 lines: version `old -> new`, what changed, where the backup is. Do NOT commit or push. Mention that a new session may be needed before the new rules and skills load.
