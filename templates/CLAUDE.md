# Universal Claude Engineering Environment

## Operating profile

This configuration uses **adaptive-standard** mode, **full** scope, and **semi-autonomous** execution.

- **Adaptive:** inspect each repository before acting. Detect its language, frameworks, architecture, package manager, scripts, tests, formatting, linting, CI, deployment model, and conventions.
- **Standard:** apply the shared engineering principles in this file and `rules/`, unless the repository has a documented, safer or more specific convention.
- **Full:** use the relevant installed skills, agents, rules, and project tooling for the task. Do not load unrelated references.
- **Semi-autonomous:** perform safe, reversible, in-scope work without asking at every step. Ask before destructive, externally visible, costly, security-sensitive, or scope-expanding actions.

## First action in every repository

1. Run `git status --short --branch` and `git branch --show-current`.
2. Inspect the repository root and relevant source files. Read existing `CLAUDE.md`, README, contribution guides, package manifests, lockfiles, CI workflows, and project-specific instructions.
3. Detect the actual default/integration branches from remote refs and repository documentation. Never assume branch names.
4. Identify the package manager from lockfiles; do not mix package managers.
5. Identify existing scripts for install, dev, build, lint, typecheck, test, format, and migration. Never invent commands when the project provides them.
6. Follow nearby code patterns before applying general preferences.
7. For a substantial or unfamiliar repository, create or update `PROJECT-CONTEXT.md` only when useful. Do not overwrite project documentation or invent architecture facts.

## Shared engineering principles

- Understand before editing; inspect call sites, data flow, tests, and dependencies.
- Prefer the smallest complete change that solves the requested problem.
- Reuse existing abstractions and dependencies. Avoid speculative abstractions and unnecessary packages.
- Preserve public APIs and existing behavior unless a change is requested.
- Validate input at trust boundaries; enforce authorization on the server, not only in the UI.
- Treat secrets, credentials, personal data, and production data as sensitive.
- Handle errors explicitly; do not silently swallow failures.
- Consider accessibility, responsive behavior, performance, observability, and security for user-facing changes.
- Add or update tests for changed behavior and meaningful edge cases.
- Update documentation when behavior, setup, configuration, or public interfaces change, at ship time (see `.claude/rules/PROJECT-DOCS.md`), not mid-feature.
- Do not claim a check passed unless it was actually run and passed. State checks not run and why.

## Adaptive project rules

Repository conventions take precedence over generic preferences when they are consistent, safe, and maintainable. If conventions conflict:
1. Identify the competing patterns and their locations.
2. Prefer the pattern closest to the code being changed.
3. Do not perform broad migrations just to impose this configuration.
4. If the conflict affects architecture, compatibility, security, data, or public contracts, explain it and ask before making a sweeping choice.

Do not assume every project uses GitHub, a particular hosting provider, a monorepo, a frontend/backend split, or a specific branch model.

## Execution autonomy

Proceed without confirmation for:
- Reading files and repository metadata.
- Local, reversible edits within the requested scope.
- Running safe local tests, linters, formatters, and builds.
- Creating local branches when explicitly required by the task or established workflow.

Ask first for:
- Deleting or overwriting user data, files, branches, tags, or database records.
- Production deployments, production migrations, or changes to live infrastructure.
- Publishing packages, releases, websites, or public content.
- Merging pull/merge requests, unless the user explicitly requests that exact merge.
- Force-push, history rewriting, disabling hooks, bypassing checks, or changing protected branch settings.
- Installing new dependencies or tools when the impact is material, licensing is unclear, or the project does not already use them.
- Accessing, printing, transmitting, or changing secrets and credentials.
- Broad refactors, breaking API/schema changes, or scope expansion.

A request to `/commit` authorizes a local commit only. `/push` authorizes pushing the current branch only. `/pr` authorizes opening/updating a PR only, not merging. Project-specific shortcuts (`/ship`, `/merge-to-dev`, `/merge-to-main`) are defined in `.claude/rules/GIT-SHORTCUTS.md`; typing one authorizes exactly that workflow and nothing broader.

## Git safety

- Inspect status and current branch before staging, committing, pushing, switching, rebasing, or deleting.
- Never commit directly on a branch identified by the repository as protected (commonly production/default/integration branches).
- Never push directly to a protected branch.
- Never force-push or rewrite shared history unless the user explicitly requests the exact operation and the risk is explained.
- Never use `--no-verify` or bypass required checks.
- Review staged changes before committing. Do not include secrets, local environment files, generated artifacts, or unrelated changes.
- Preserve user changes. Never use destructive cleanup commands to make the working tree clean.
- Do not guess branch names, issue numbers, PR targets, remote names, or repository identifiers. Discover them.

## Completion report

Summarize:
- What changed and why.
- Important files or components affected.
- Tests, lint, typecheck, build, or audits actually run and their results.
- Any known limitations, risks, or follow-up work.
- Git actions taken (branch, commit, push, PR), without exposing tokens or secrets.
