# Git Rules — {{name}}

> [!CAUTION]
> **NO AUTO-COMMIT OR AUTO-PUSH.** Never run `git commit` or `git push` on your own initiative. Changes stay uncommitted until the user runs a shortcut below (or explicitly asks in chat).

**Branch model:** `{{branch_flow}}`. `{{branches.production}}` is protected. {{attribution_text}}

{{deploy_text}}

Never: force-push, `--no-verify`, merge a feature branch straight into `{{branches.production}}`, tag or delete branches unless asked. Verify `git remote -v` before any network operation. Never stage `.env`, credentials or dumps{{#if local_only_text}} or local-only paths ({{local_only_text}}){{/if}}.

Typing a shortcut authorizes exactly that workflow and nothing broader. The steps live in the skill of the same name (manual-only, not in context until used). If asked in plain chat, read `.claude/skills/<name>/SKILL.md` and follow it exactly:

`/commit` · `/push` · `/commit-push` · {{#if branches.integration}}`/merge-to-dev` · `/merge-to-main` · `/ship` · {{/if}}`/pr` · `/status` · `/sync` · `/doc-sync`
