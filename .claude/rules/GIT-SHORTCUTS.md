# Git Rules — agents-template

**NO AUTO-COMMIT OR AUTO-PUSH.** Never run `git commit` or `git push` on your own initiative; changes stay uncommitted until the user runs a shortcut below or asks in chat.

Branch model: `feat/example → dev → main`. `main` is protected. Do not add `Co-Authored-By` or "Generated with" lines to commits or PRs.

Deployment is manual; pushing does not deploy. Never deploy without explicit approval.

Never: force-push, `--no-verify`, merge a feature branch straight into `main`, tag or delete branches unless asked. Verify `git remote -v` before network operations. Never stage `.env`, credentials or dumps or local-only paths (`.env`).

A shortcut authorizes exactly that workflow. Steps are in the skill of the same name (`.claude/skills/<name>/SKILL.md`, manual-only):

`/commit` · `/push` · `/commit-push` · `/merge-to-dev` · `/merge-to-main` · `/ship` · `/pr` · `/status` · `/sync` · `/doc-sync`
