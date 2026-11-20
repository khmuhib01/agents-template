# Changelog

Generated from the version-tagged commits. Newest first. Bumping `VERSION` shows up as an upgrade (`old → new`) in projects that re-run `init.mjs`.

## 1.15.0 - 2026-11-21

- SEO (phase P4): `seo-on-page-content`, `seo-web-vitals`, `seo-international-ecommerce` complete the six-skill `domains: [seo]` set
- reworked with references (existing rules and approval gates kept): `security-audit` (severity rubric, web checklist, authn/authz/tenancy, supply chain), `api-engineering`, `database-engineering` (migration safety, scaling), `devops-engineering`, `performance-engineering`, `nextjs-development` (rendering/caching, security/testing)
- "Not for ..." clauses on overlapping skills (audit, technical-debt, test-engineering, ui-ux-engineering, security-audit, devops-engineering, performance-engineering)
- token cost of the longer descriptions on always-installed skills: laravel sample 3321 -> 3436, expo 3370 -> 3467, python (all) 5119 -> 5447 always-loaded tokens
- evals: 18 more trigger cases; 135/135 offline. Three cases are marked `live-only` where lexical ranking cannot show a second expected skill

## 1.14.0 - 2026-11-21

- SEO (phase P3): new `domains: [seo]` set with skills `seo-technical` (with Next.js, React SPA, Laravel, WordPress references), `seo-structured-data`, `seo-migration-monitoring`; recommendations are labelled Requirement/Guideline/Practice and never promise rankings or rich results (lint-enforced)
- new skills `php-development`, `wordpress-development` (tokens `php`, `wordpress`, `woocommerce`) and `mobile-quality` (now a dependency of the mobile framework skills; expo sample 3307 -> 3370 always-loaded tokens, python skills_mode all 4697 -> 5119, laravel unchanged)
- evals: 19 more trigger cases; tests for seo/wordpress routing; every new skill ships `references/SOURCES.md` with no verified sources yet

## 1.13.0 - 2026-11-21

- mobile (phase P2): new skills `android-kotlin-development`, `mobile-architecture`, `mobile-security`, `mobile-release`, each with `references/`; flutter, react-native and swift skills gain reference files (architecture, data/offline, native, performance/a11y, security, release)
- routing: tokens `android`, `compose`, `jetpack`, `swiftui`; mobile framework skills depend on the three shared mobile skills; `type: mobile` adds mobile-architecture and mobile-security (expo sample: +219 always-loaded tokens, 3088 -> 3307)
- evals: 23 mobile trigger cases (positive, negative, multi-skill); every skill has `references/SOURCES.md` with no verified sources yet, listing documentation names to verify
- jvm-development description points Android projects to the new skill

## 1.12.0 - 2026-11-21

- foundation for the skills expansion (no new skills yet; see docs/SKILLS-BLUEPRINT.md): `deps` in skill-map.json (transitive), optional `domains` config key, `lib/routing.mjs`
- init no longer installs `evals/` or `examples/` folders found inside a skill
- tests: routing unit tests and skill lint (size cap, link integrity, indexed references, SOURCES.md format, SEO overclaim check)
- evals: schema v2 in evals/triggers/*.json (negative, expect_all, tags) and `evals/run.mjs --report`; cases.json unchanged

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
