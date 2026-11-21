# Changelog

Generated from the version-tagged commits. Newest first. Bumping `VERSION` shows up as an upgrade (`old → new`) in projects that re-run `init.mjs`.

## 1.19.0 - 2026-11-21

Stale cleanup. init used to only add, so what it generated earlier and no longer generates stayed forever.

- stale generated files are removed: files recorded in `.template-hashes.json` that this run does not generate (`skills_mode: all` -> `focused`, a renamed skill, a removed package or hook) and that are still unchanged. Each is copied to `.claude/.init-backup/<time>/` first. A stale file you edited is kept and reported once. A skill or file you created is never touched, and a removed package loses its generated `CLAUDE.md` but not its folder. Forged entries in the hash file (`..`, absolute paths, non-generated files) are ignored.
- stale permission rules are removed: init now records the rules it wrote (`managedPermissions` in the manifest). Changing `test_command` no longer leaves the old `Bash(...:*)` auto-approval behind; removing a `local_only` entry or setting `protect_secrets: false` / `allow_safe_commands: false` removes the rules init wrote. Rules you added stay. The first run after upgrading has no record, so it removes no permission rule and starts tracking.
- `--dry-run` lists removals as `removed <file>` and `--check` counts them as out of date; a summary line is printed only when something was removed.
- not covered: `mcp_allow` / `mcp_deny` entries.
- tests: 22 new checks, 11 of which fail without the change.

## 1.18.2 - 2026-11-21

Second hardening pass from the same audit.

- `protect_secrets` denies more: `.env.development/.staging/.test` and the `.local` variants, `*.pem`, `*.key`, `id_rsa*`, `id_ed25519*`, `.npmrc`, `.netrc`, `~/.ssh`, `~/.aws`. `.env.example` is deliberately not denied.
- `guard-secrets` matches case-insensitively and judges the real target of a symlink (`notes.txt -> .env` was not recognised).
- `guard-bash` sees through `env`, `sudo`, `command`, `bash -c`, `eval`, `$(...)` and backticks, blocks `git push --mirror/--all`, and asks before `core.hooksPath` is changed. Documented as best effort: the real protection is branch protection on the host.
- init refuses to write through a symlinked `.claude`, `.agents`, `.codex`, `.vscode`, `.gitignore`, `AGENTS.md` or `CLAUDE.md` (a hostile repo could point one outside the project).
- a `{{...}}` the user wrote in a config value (Blade/Vue example in `notes`) is no longer reported as an unresolved placeholder after the files were written.
- `--scaffold`: a folder or branch name with a space, `#` or `:` is quoted; next+react and expo+react-native are both detected (a short-circuit dropped the second).
- `project.config.example.yml` no longer carries a real project's name, url and branch; `.github/workflows/test.yml` declares `permissions: contents: read`; the `review` skill description is shorter and points to `code-review` for PRs.
- tests: 17 new checks, 12 of which fail without the fixes.

## 1.18.1 - 2026-11-21

Config hardening, found by a read-only audit. Re-run `init.mjs` in existing projects; a config that now fails validation prints exactly which line to change.

- `test_command` and `format_command` must be one plain command (no `;` `&` `|` `` ` `` `$` `<` `>` or newline) and must not start with a shell, downloader or privilege tool. `test_command` becomes an auto-approved `Bash(...:*)` permission and `format_command` runs through a shell on every edit, so an unchecked config line was a way to run any command without a prompt. `docker.dir` and `docker.service` are limited to safe characters. The `format` hook re-checks the command at run time.
- YAML: `False` / `TRUE` are booleans (they were truthy strings, so `protect_secrets: False` was silently ignored); `1.10` and `007` stay strings instead of becoming `1.1` and `7`.
- a failed post-write check (placeholder, `forbid`) now still saves `.template-hashes.json`, so the next run no longer mistakes untouched files for hand edits and writes needless `.init-backup` copies.
- `--check` ignores the machine-local `.vscode/settings.json` (it reported false drift on a fresh checkout); the VS Code step is skipped when `git check-ignore` fails for a reason other than "not ignored".
- `packages.<x>.path: "."` is rejected (it overwrote the root `CLAUDE.md` and broke idempotency).
- tests: 15 new checks, 12 of which fail without the fixes, plus a budget gate in the `bench` section: always-loaded context must stay at or below the measured value plus about 10% (3800 / 3850 / 6700 tokens for the three samples).

## 1.18.0 - 2026-11-21

- new global command `/agent-update` (plugin: `/agents-template:agent-update`): pulls the template when it is a git clone, compares the project's `.claude/.template-version` with `VERSION`, lists the newer changelog entries, dry-runs, asks, then runs `init.mjs`. It never commits or pushes.

## 1.17.2 - 2026-11-21

- README: `protect_secrets` now states what it covers. It blocks the Read tool and writes, but not shell commands: in a real run `node -e` printed a fake `.env` when `Bash(node *)` was allowed; with the template's own narrow allow list the command waited for approval. Advice added not to grant broad Bash rules in projects that hold secrets.
- `core/rules/SECURITY.md`: one sentence telling the model not to read secret files through shell commands. This is guidance, not enforcement (adds about 20 tokens to the always-loaded rules, estimated as characters divided by 4).

## 1.17.1 - 2026-11-21

- routing fixes found by the P7 audit (`docs/ROUTING-DESIGN.md`): stack spellings `tailwindcss`, `nodejs`, `springboot`, `jetpack-compose`, `expo-router`, `aspnet`, `.NET`, `ts` now route to the same skills as their short forms; existing projects that wrote one of these get the matching skill on the next `init.mjs` run (it was silently unmatched before)
- the unmatched-token warning now says when a token is a domain (for example `seo`) and should go under `domains`
- README: the focused-saving line is printed only in `skills_mode: all`
- docs: `docs/SKILL-AUDIT.md`, `docs/INDUSTRY-SKILL-COVERAGE.md`, `docs/ROUTING-DESIGN.md`; table-driven routing tests (positive, negative, ambiguous)

## 1.17.0 - 2026-11-21

- full-stack and product skills (phase P6), all opt-in through `domains`, no change for existing projects: `saas-multitenancy`, `payments-billing`, `realtime-systems`, `event-driven-architecture`, `search-engineering`, `product-discovery`, `prd-requirements`, `product-delivery`, `production-readiness` (each with references and SOURCES.md; payments never uses live credentials, product stages wait for approval)
- `build` mentions an optional full lifecycle (discovery -> PRD -> delivery plan -> build -> readiness) with approval at every stage
- offline trigger eval now models focused mode: opt-in domain skills only compete in cases that name the domain (`domains` field) or one of their skills; 14 more cases (149 total)
- `audit` description reworded (the "Not for" clause had made it rank for diff reviews)

## 1.16.0 - 2026-11-21

- live evaluation tooling (phase P5), no results recorded yet: `evals/live.mjs` runs v2 cases with repeats, per-skill recall/precision, `--type/--stack/--domains` realism, `--max-calls` cap and `--out`; `evals/scenarios.mjs` runs 5 task scenarios (SEO regression, Product JSON-LD, Expo token storage, WordPress plugin security, React 18 version gate) with deterministic graders; `evals/report.mjs` builds `evals/REPORT.md`
- `node evals/scenarios.mjs --check` (free, in test.mjs) proves each scenario's graders fail on the bare fixture and pass on a reference solution
- first scenario pilot recorded in evals/REPORT.md (5 scenarios x 2 arms x 1 run, sonnet, about $1.1 total): all passed in both arms, skills arm cost more; scenarios are too easy to separate the arms
- `live_expect_all` / `live_not` on trigger cases carry expectations that lexical ranking cannot check

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
