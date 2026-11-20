# Changelog

Generated from the version-tagged commits. Newest first. Bumping `VERSION` shows up as an upgrade (`old → new`) in projects that re-run `init.mjs`.

## 1.11.0 - 2026-11-20

- perf: leaner always-loaded context (4.7K -> 3.2K tokens for a node api): skills_mode defaults to focused, layout/notes no longer duplicated in ARCHITECTURE.md, merged duplicate rules, shorter CLAUDE.md files
- fix: skill routing no longer lists skills that are not installed in focused mode
- bench-cost.mjs reports cache write/read tokens separately; measured cost gap vs no template +57% -> +37%
- note: existing projects keep already-installed skills (init never deletes them); set skills_mode: all to restore the old default

## 1.10.0 - 2026-11-20

- bench.mjs: reproducible static-context benchmark (generated vs unoptimized setup)
- evals: 70 prompts (was 42); technical-debt skill now matches "tech debt"
- internal: init.mjs split into lib/ modules; CI and pre-commit keep plugin files in sync

## 1.9.2 - 2026-11-20

- feat: write .vscode/settings.json so the @ picker finds git-ignored files (6e52b7b)

## 1.9.1 - 2026-11-20

- fix: make VS Code @ picker list agents when .claude/ is git-ignored (123cc94)

## 1.9.0 - 2026-11-20

- feat: monorepo packages, opt-in statusline/session context/MCP, plugin, live eval (5518a80)

## 1.8.0 - 2026-11-20

- feat: safe upgrades - hand-edit protection, --check, config schema (4d63276)

## 1.7.0 - 2026-11-20

- feat: cost optimizer - manual-only skills, read/context hooks, model profiles, budget report (7370cc5)

## 1.6.0 - 2026-11-20

- feat: stricter YAML parser, core rules, focused scaffold, stack tests, skill eval (537638f)

## 1.5.0 - 2026-11-20

- feat: hooks generator (guard-bash, guard-secrets, format) (cc6ea1f)

## 1.4.0 - 2026-11-13

- feat: planner, debugger, devops-engineer agents and /build skill (a120858)

## 1.3.1 - 2026-11-13

- perf: cut credit use (short completion report, no proactive subagents, pin reviewers to sonnet) (81d5900)

## 1.3.0 - 2026-11-13

- feat: Codex and Antigravity support (5450fd8)

## 1.2.0 - 2026-11-13

- feat: skills for Go, Rust, JVM, .NET, Flutter, Ruby, Swift (23cbdff)

## 1.1.0 - 2026-11-13

- feat: token-saving settings, version stamp, smoke tests and CI (fc8b2da)
