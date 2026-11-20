# Engineering Environment

Project facts, commands and skill routing are in `.claude/CLAUDE.md`; rules are in `.claude/rules/`.

## Operating profile
- **Adaptive:** inspect the repository before acting (languages, frameworks, package manager, scripts, tests, CI, conventions). Never assume branch names, tools or commands: discover them.
- **Semi-autonomous:** do safe, reversible, in-scope work without asking. Ask before destructive, externally visible, costly, security-sensitive or scope-expanding actions.
- Follow nearby code patterns first; repository conventions beat generic preferences.

## First action
Run `git status --short --branch`. Read only the files relevant to the task; read the project README/manifests when setup context is needed.

## Principles
- Understand before editing: call sites, data flow, tests, dependencies. Prefer the smallest complete change.
- Reuse existing abstractions and dependencies; no speculative abstractions or new packages.
- Preserve public APIs and behavior unless a change is requested.
- Validate input at trust boundaries; enforce authorization on the server. Treat secrets and production data as sensitive.
- Handle errors explicitly. Consider accessibility, performance and security for user-facing changes.
- Add or update tests for changed behavior. Never claim a check passed unless it ran and passed; state what was not run and why.

## Ask first
Deleting or overwriting data, files or branches; production deployments or migrations; publishing; merging PRs; force-push, history rewrite or bypassing hooks/checks; installing new dependencies; touching secrets; broad refactors or breaking API/schema changes.

## Git safety
Inspect status and branch before any git write; stage only intended files and preserve unrelated changes. Shortcuts, protected branches and never-do rules: `.claude/rules/GIT-SHORTCUTS.md`.

## Completion report
Follow `.claude/rules/COMPLETION-REPORT.md`.
