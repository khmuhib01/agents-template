# Git Rules — {{name}}

**NO AUTO-COMMIT OR AUTO-PUSH.** Never run `git commit` or `git push` on your own initiative; changes stay uncommitted until the user runs a shortcut below or asks in chat.

Branch model: `{{branch_flow}}`. `{{branches.production}}` is protected. {{attribution_text}}

{{deploy_text}}

Never: force-push, `--no-verify`, merge a feature branch straight into `{{branches.production}}`, tag or delete branches unless asked. Verify `git remote -v` before network operations. Never stage `.env`, credentials or dumps{{#if local_only_text}} or local-only paths ({{local_only_text}}){{/if}}.

A shortcut authorizes exactly that workflow. Steps are in the skill of the same name (`.claude/skills/<name>/SKILL.md`, manual-only):

`/commit` · `/push` · `/commit-push` · {{#if branches.integration}}`/merge-to-dev` · `/merge-to-main` · `/ship` · {{/if}}`/pr` · `/status` · `/sync` · `/doc-sync`
