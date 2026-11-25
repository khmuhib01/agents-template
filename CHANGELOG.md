# Changelog

Generated from the version-tagged commits. Newest first. Bumping `VERSION` shows up as an upgrade (`old → new`) in projects that re-run `init.mjs`.

## 1.23.1 - 2026-11-25

Shortcuts are authorization, not suggestions.

- `/merge-to-dev`, `/merge-to-main` and `/ship` now state that typing the command is the user's explicit approval to push the protected branch. An agent no longer refuses and sends you to a PR because of "protected" wording or a project note saying "never push"; it runs the flow and stops only if the host rejects the push.
- `/merge-to-main` and `/ship` no longer ask "Push these commits?" a second time; the command and the push permission prompt are the confirmation.
- `AGENTS.md` and `GIT-SHORTCUTS` wording: no push to a protected branch on your own initiative, but the shortcuts are explicit authorization.
- Wrapped projects: a line in your own `project.config.yml` `notes` such as "Never push to dev/main" is still read by the agent. Reword it (for example "pushes go through /merge-to-dev and /merge-to-main") or the agent may follow it over the skill.

## 1.23.0 - 2026-11-25

Secret files and protected branches are ask-first instead of hard-blocked (new defaults; upgrading projects change behavior).

- New `secrets_access` (`ask` default, `deny`): `.env` variants, keys, `~/.ssh`, `~/.aws` and `local_only` paths move from `permissions.deny` to `permissions.ask`, so Claude Code shows a prompt and reads the file when you approve. `guard-secrets` asks before editing `.env*` and local-only paths; content that looks like a secret is still blocked. `deny` keeps the old behavior.
- New `protected_push` (`ask` default, `block`): `guard-bash` asks before a commit or push on the production/integration branches instead of refusing, so `/merge-to-dev`, `/merge-to-main` and `/ship` work once you approve. Force-push, `--no-verify` and `push --all/--mirror` are always blocked.
- Rules (`GIT-SHORTCUTS`, `SECURITY`, `git-manager`) now say: ask first, act after approval. Re-running init moves old managed deny rules to ask; `settings.json` rules you wrote stay.

## 1.22.4 - 2026-11-22

Eval results only; generated projects and routing behavior are unchanged.

- Measured 8 medium/hard scenarios (migration, payments, tenant isolation, security, seo, react, mobile, structured data) x 3 runs through `orchestrated` on `sonnet`: 18 of 24 passed (75%), about $0.14 per run, $3.38 total. `payments-webhook-refund` failed 3 of 3 (always the `refund-idempotent-on-redelivery` grader), `structured-data-product` passed 1 of 3 (the repair step did not fix the 2 failures), `seo-noindex-regression` 2 of 3 (one run fixed the code but wrote no regression test). So "same success rate as the strong model" is shown only for simple tasks, not for harder ones: the strong model itself does not reach 100% here.
- Re-ran the 3 failing scenarios through `routed` (3 runs each, $0.98): 6 of 9 passed. The router sent `seo-noindex-regression` and `payments-webhook-refund` to `sonnet` (complex), so the difference from `orchestrated` there (2/3 to 3/3, 0/3 to 1/3) is the same model and is noise, not a routing effect. Only `structured-data-product` went to `haiku` (medium): 2 of 3 passed at about $0.013 per run against about $0.20 on `sonnet` (about 93% lower), the one real saving in this set.
- First escalation on a real model: one `structured-data-product` run failed on `haiku`, was repaired on `sonnet` (`haiku+sonnet`, 1 repair) and still failed ($0.104). The path works end to end; it did not rescue that run.
- Caveats: 3 runs per cell, scenarios written by me (not tasks from a real project), and the two arms ran at different times, not as a controlled pair. `payments-webhook-refund` passed only 1 of 6 on `sonnet` although its reference solution passes the graders (`--check`), so it is hard or its goal is under-specified; this is not a routing issue. Total spend $4.36.

## 1.22.3 - 2026-11-22

Cheap-first routing with escalation (orchestrate.mjs, opt-in).

- `model_routing.escalate`: when the tests fail after the routed model's work, the repair step runs on this stronger model (one counted call, event `model_escalated`). Plan and implement stay on the routed model. Ignored when `--model` is given. Without `escalate` nothing changes.
- eval arm `routed` (`--arms routed`): orchestrate with `--profile auto` and the model from `model_routing` (default simple/medium `haiku`, complex and escalate `sonnet`; override with `EVAL_ROUTING="simple=a,medium=b,complex=c,escalate=d"`).
- Measured (5 simple scenarios x 3 runs, orchestrated with sonnet vs routed, $1.52 total): both passed 15 of 15; $0.096 vs $0.005 per run (94% lower), 2.0 vs 1.4 model calls per run (the tiny profile skips the planner on simple goals). Caveats: easy tasks written by me, `medium` was set to the cheap model here (opt-in config, not the default behavior), no repair or escalation happened, mean time 15.4s vs 18.4s, and the saving mixes model price with the skipped planner call.
- 2 harder scenarios with visible tests (`hard-expression-evaluator`, `hard-cron-next-run`; the cron expected values come from the reference solution and were spot-checked by hand). Tried to trigger the escalation path for real: `haiku` passed all 8 runs (4 + 4, about $0.008 per run), so the repair-on-stronger-model path has still not been exercised against a real model; it is covered only with a fake CLI. No failure was staged.
- `EVAL_SCENARIOS_DIR` lets `evals/scenarios.mjs` read scenarios from a folder outside the repo, for tasks taken from private projects whose code must not be committed here.
- First real-task measurement (2 bug-fix tasks taken from the history of a private Laravel project, 5 runs per model, $1.15 total; the code is not in this repo): `haiku` 9 of 10 and `sonnet` 9 of 10 passed, at about $0.010 and $0.105 per run. The router sent both to the strong model (one goal mentions "production", the other is medium), so it used none of that saving. The classifier was not loosened on two tasks; the intended way to use the saving where tests exist is `model_routing.medium: <cheap>` with `escalate`.

## 1.22.2 - 2026-11-22

Classifier fixes found with a second labeled set (`evals/routing-heldout.json`, 20 goals written before the change). Affects `orchestrate.mjs --profile auto` and `model_routing` only.

- A short goal with no positive cue was rated `simple` ("write tests for the invoice calculator" went to the cheapest model). Now `simple` needs a cue (typo, grammar, rename, explain, changelog, copyright, ...) or a bug fix naming exactly one file; anything else is `medium`.
- `JWT`, token, session, password, login, SSO/SAML/MFA, CORS, SSRF, SQL and signature work is now `complex` (a JWT refresh-token task was rated medium).
- Building words (`implement`, `endpoint`, `page`, `schema`, `export`, ...) and spread words (`everywhere`, `across`, `all`, `modules`) keep a goal out of `simple`; a file name such as `src/page.js` no longer counts as one.
- Before: held-out 17/20 correct, 1 false-simple, 1 missed complex. After: 20/20, 0 and 0. The set is no longer held-out now that I tuned against it, so that number is a regression check, not an estimate of accuracy on new goals. A test requires zero false-simple and zero missed complex over all 34 labeled goals.
- Effect on the recorded simple-scenario runs (haiku and sonnet both 25/25): 3 of 5 are now routed to the cheap model instead of 2, so the routed total is 51% cheaper per passing task instead of 34%. The 8 earlier security/database scenarios are unchanged (none goes to the cheap model).

## 1.22.1 - 2026-11-22

Eval tooling only; generated projects are unchanged.

- 5 simple scenarios in `evals/scenarios/` (typo, explain a function, rename across files, one-file off-by-one fix, changelog entry), each with deterministic graders and a reference solution (`node evals/scenarios.mjs --check` is green for all 13).
- `node evals/routing-ab.mjs --cheap a.json --strong b.json`: offline, composes recorded runs into "routed vs all strong model" using the classifier, with an optional modeled escalation column.
- Paid result (25 runs per model, 5 scenarios x 5 runs, $1.39 total): `haiku` and `sonnet` both passed 25 of 25; haiku cost about $0.004 and sonnet about $0.052 per run. The classifier sent only 2 of the 5 to the cheap model (typo, explain; the other three were classified medium), so the routed total is 34% cheaper per passing task at the same success rate. Sending all 5 to haiku would have been about 92% cheaper, but that is not what the router does.

## 1.22.0 - 2026-11-22

Fixes two bugs from the 1.21.0 audit.

- **install-global ownership (bug in 1.21.0):** an existing skill with the same content was marked as installed by this tool, and `--uninstall` then deleted the whole folder. Ownership is now a manifest, `<skills>/.agent-template.json`, with the sha256 of the SKILL.md written. A skill is ours only if the folder did not exist (or held only temp files) or you adopted it with `--force`. Update replaces a managed skill only while it is unmodified; a modified one is kept unless `--force` (backup first). `--uninstall` removes managed, unmodified skills with nothing else in the folder; it never touches an unmanaged skill, even with `--force`. Files are written via temp file + rename; an interrupted install is completed on the next run. `--update` is accepted (it is the default); backups are always made, so there is no separate `--backup`.
- Migration: the `.agent-template` marker files from 1.21.0 are not trusted (some were written for skills you own). Run `node install-global.mjs --force` once to adopt the installed global skills (backed up), or leave them alone.
- **orchestrate budget when a call reports no cost:** the cost was counted as 0, so the cost cap did not limit anything. New `--budget-policy strict|balanced|best-effort` (default `balanced`): balanced reserves the per-call cap for such a call, strict stops scheduling once a cost is unknown, best-effort keeps the old behavior. `spent` stays provider-reported only; reservations and a cost above the per-call cap (`overspend`) are shown separately. Still not a hard provider limit: the CLI checks its cap between turns. Old ledgers keep working.
- **model routing and complexity** (orchestrate.mjs only, opt-in): `lib/routing-tasks.mjs` classifies a goal as simple/medium/complex with fixed rules (no model call) and suggests agents; `--profile auto` maps it to tiny/small/medium (default stays `small`). Optional `model_routing` config (`enabled`, `simple`, `medium`, `complex`, `fallback`; no model ids built in, validated by init and the schema). Explicit `--model` always wins; a fallback model is tried once, as a counted call, only when the failure is about the model. The ledger records level, agents, model and its source.
- `evals/report.mjs` prints Credit Reduction (%) on cost per passing run next to the success rate, from recorded runs only. `node bench.mjs` prints the agents invoked under the delegation policy against all-four-every-time, over `evals/routing-cases.json` (a policy count, not cost). Recorded results so far show the skills and orchestrated arms costing more than baseline.
- README: budget policy, routing, hook failure behavior and limits.
- `--resume` after a strict-policy stop no longer suggests a larger `--max-cost` (it cannot help): it explains that and accepts `--resume ID --budget-policy balanced|best-effort`.
- first paid model comparison recorded (haiku vs sonnet, 16 runs each, about $1.42 total): 69% vs 88% pass, 87% lower cost per passing run for haiku. Summary in the README; raw runs in `evals/results/`.
- tests: install-global rewritten for scenarios A-I (ownership, dry-run, update, edited file, uninstall, interrupted install, idempotence); 6 budget-policy checks.

## 1.21.0 - 2026-11-21

Safer global install, fail-closed guards.

- `install-global.mjs` no longer overwrites silently. A skill it installs gets a `.agent-template` marker. Same-named skills without the marker (yours, or installed before 1.21) are skipped unless `--force`. Changed managed skills are updated; unchanged ones are left alone. Every overwrite or removal is copied to `<skills>/.agent-template-backup/<time>/` first. New: `--force`, `--uninstall` (removes only marked skills unless `--force`); `--dry-run` shows the plan.
- **Behavior change:** `guard-bash`, `guard-secrets` and `guard-read` now fail closed. A guard that crashes or gets invalid input exits 2 (blocks the call) instead of 1 (call allowed). If a hook bug blocks your work, set `HOOK_FAIL_OPEN=1`. `format` and the context hooks stay non-blocking.
- Migration: after upgrading, run `node install-global.mjs --force` once to adopt skills installed by an older version (a backup is made); re-run `node init.mjs` in projects to refresh the hooks.
- generated `AGENTS.md` gets a short delegation rule (item 8): small work runs directly; planner, architect, security-reviewer and code-reviewer only when the change justifies them.
- `node init.mjs --strict`: warnings (unknown config key, stack token or domain that matches no skill) become errors and nothing is written. Without it they only warn, as before.
- `node bench.mjs` also prints where the generated context goes (instructions, agents, skills, rules); `--json` has it as `parts`.
- tests: 14 new checks; the install-global and fail-closed ones fail without the change.

## 1.20.0 - 2026-11-21

Last items from the audit.

- `mcp_allow` / `mcp_deny` are covered by stale cleanup: init remembers what it enabled and denied (`managedMcp` and `managedPermissions` in the manifest). A server dropped from the config is no longer enabled or denied; servers and rules you added stay. The `enableAllProjectMcpServers: false` that init set goes away with the last `mcp_allow` entry, but a value you set yourself is kept. The first run after upgrading has no record and removes nothing.
- the YAML parser no longer treats an apostrophe inside a plain value as the start of a string: `notes: don't # comment` keeps its comment handling and `[don't, x]` is a list. `''` inside single quotes is now read as one apostrophe.
- `.github/workflows/test.yml` pins `actions/checkout` and `actions/setup-node` to commit SHAs (v4.4.0); a test fails if an unpinned action is added.
- tests: 11 new checks; the cleanup, YAML and pinning ones fail without the change.

## 1.19.1 - 2026-11-21

- `--target`, `--config` (and any value flag) with no value now stop with `✖ --target needs a value` instead of taking the next flag as the value. `node init.mjs --target --dry-run` used to look for a folder named `--dry-run`.
- tests: 3 new checks, all fail without the change.

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
