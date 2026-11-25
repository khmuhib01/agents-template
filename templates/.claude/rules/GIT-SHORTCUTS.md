# Git Rules — {{name}}

**NO AUTO-COMMIT OR AUTO-PUSH.** Never run `git commit` or `git push` on your own initiative; changes stay uncommitted until the user runs a shortcut below or asks in chat.

Branch model: `{{branch_flow}}`. `{{branches.production}}` is protected. {{attribution_text}}

{{deploy_text}}

Never: force-push, `--no-verify`, merge a feature branch straight into `{{branches.production}}`, tag or delete branches unless asked. Verify `git remote -v` before network operations. Never stage `.env`, credentials or dumps{{#if local_only_text}} or local-only paths ({{local_only_text}}){{/if}}.

**Protected branches and secret files are ask-first, not forbidden.** Committing or pushing on a protected branch, and reading or editing `.env` and other secret files, trigger a permission prompt. Once the user approves (the prompt, or an explicit yes in chat for that action), do it; without approval, do not. `protected_push: block` and `secrets_access: deny` in `project.config.yml` turn these into hard refusals.

A shortcut authorizes exactly that workflow. Steps are in the skill of the same name (`.claude/skills/<name>/SKILL.md`, manual-only):

`/commit` · `/push` · `/commit-push` · {{#if branches.integration}}`/merge-to-dev` · `/merge-to-main` · `/ship` · {{/if}}`/pr` · `/status` · `/sync` · `/doc-sync`
