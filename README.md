# claude-template

One config file per project → generates `AGENTS.md`, `CLAUDE.md` and `.claude/` (rules, skills, agents) for that project.

## Quick start (3 steps)

1. `node <path-to>/agents-template/init.mjs --scaffold` in your project: drafts `project.config.yml` from the detected stack.
2. Open `project.config.yml` and check `name`, `type`, `stack`, `test_command`, `branches` (the rest is optional).
3. `node <path-to>/agents-template/init.mjs`: generates everything. Re-run any time; `--dry-run` previews.

The smallest valid config is `name`, `type`, `stack` and `branches.{working,production}`. Every other key has a default.

## What it saves, and what is not measured

**Measured, and not flattering: on short read-only tasks the template costs more than no template.**

`node bench-cost.mjs` (spends real money) runs the same 5 read-only prompts with `claude -p` on a small fixture project, once with no template and once with the generated setup, same model (sonnet) in both. Runs on 2026-11-20 (Claude Code 2.1.329, n=5 per arm after a warm-up, so treat the size as rough; the direction was the same for every task):

| avg per run | no template | v1.10.0 | v1.11.0 (lean) |
|---|---|---|---|
| cost | $0.047 | $0.073 (+57%) | $0.060 (+37%) |
| input tokens (summed over turns) | 123K | 148K (+20%) | 123K (+7%) |

The remaining gap is the template's always-loaded context (now about 3.2K tokens, was 4.7K), which is written to the prompt cache once at the start of every session (1.25x price) and then re-read each turn (0.1x). Measured per run: about 4K more cache-write tokens than no template, roughly $0.015. In a long session that is paid once, so it shrinks to a few percent of the session cost (rough arithmetic from the published price ratios, not measured here). On short tasks it is pure overhead: there was nothing for the template to save, and even the log and lockfile prompts did not trigger runaway reads in the baseline.

v1.11.0 cut the always-loaded context by a third: `skills_mode` now defaults to `focused`, layout and project notes are no longer loaded twice, duplicated rules were merged, and the skill routing no longer lists skills that are not installed.

`node bench.mjs` shows the static side only: the generated setup carries 16-20% less always-loaded context than a *worse version of itself* (all skills model-invocable, path-scoped rules always loaded). It does **not** compare against having no template, so do not read it as a saving.

What is **not** measured, and where a saving could still exist: `model_profile: economy` (cheaper models for agents; both arms above used the same model), long sessions with large files where `guard-read` / `deny_heavy` stop expensive reads, and the `/compact` nudge. If you want the template for cost, use `skills_mode: focused`, `model_profile: economy` and a `token_budget`, and measure on your own project with `bench-cost.mjs`. Its main value today is consistency and safety (hooks, rules, one config for three agents), not lower cost.

Also not verified yet: use by anyone other than the author. (The plugin install via `claude plugin install` was checked once on Linux with Claude Code 2.1.329: marketplace add, install, `/agents-template:agent-setup-scaffold` and a full init, 67 files generated.) `evals/run.mjs` (70 prompts, written by the author) guards skill-description quality offline; it does not measure how a real model triggers skills (`evals/live.mjs` does, and costs money).

## Use it in a new project

```bash
cd <your-project>
node <path-to>/agents-template/init.mjs --scaffold   # writes a draft project.config.yml from the detected stack
# edit project.config.yml (the only file you touch), then:
node <path-to>/agents-template/init.mjs              # generate
```

Re-run `init.mjs` any time: after editing the config, or after improving the template (it refreshes the generic parts in every project). Files it changes are first backed up to `.claude/.init-backup/<timestamp>/` (add that folder to `.gitignore`). `--dry-run` shows what would change.

**`@` picker and agents.** The `@` picker in the VS Code extension is a file search that obeys `.gitignore`, and it only mentions files; it does not list agents. To run an agent, name it in chat or use `/agents`. The generated folders are git-ignored, so the picker would not find them. `init.mjs` therefore adds `search.useIgnoreFiles: false`, `search.useParentIgnoreFiles: false` and a `search.exclude` entry for `**/.claude/.init-backup` to `<project>/.vscode/settings.json` (Reload Window once). Only missing keys are added (your values, comments and line endings are kept), a second run changes nothing, and it is written only when `.vscode/` is git-ignored, otherwise init warns and skips so teammates' editors are not affected. Set `vscode_settings: false` to opt out. User-level VS Code settings are never touched.

Works on Windows, macOS and Linux (CI tests all three). Requires Node 18+ and git. No dependencies.

`--scaffold` detects PHP/Laravel, Node (React, Next, Vue, Nuxt, Express, Nest…), Python, Go, Rust, Ruby/Rails, Java/Kotlin, .NET, Flutter, Swift/iOS and React Native/Expo, each with its own skill. Any other project still works: set `stack` and `test_command` by hand.

## Set up on a new PC (global slash commands)

Two global commands let you work from the chat instead of the terminal: `/agent-setup-scaffold` (drafts `project.config.yml`) and `/agent-init` (generates the files). Their sources live in `global-skills/`. They are installed for **Claude Code, Codex and Antigravity (Gemini)**.

Needs git and Node 18+ (Windows: `winget install Git.Git OpenJS.NodeJS.LTS`, macOS: `brew install git node`).

```bash
git clone https://github.com/khmuhib01/agents-template.git <any-folder>/agents-template
cd <any-folder>/agents-template
node install-global.mjs            # every agent found on this PC
node install-global.mjs --codex    # or pick: --claude --codex --antigravity, or --all
```

| Agent | Global skills folder |
|---|---|
| Claude Code | `~/.claude/skills/` |
| Codex | `~/.codex/skills/` |
| Antigravity (Gemini) | `~/.gemini/config/skills/` |

`~` is your home folder (`C:\Users\<you>` on Windows).

- The script rewrites the template path inside the skills to wherever you cloned it, so the folder can be anywhere, but it must stay on the PC (the skills run `init.mjs` from it).
- Restart the agent afterwards, then in any project: `/agent-setup-scaffold` → edit `project.config.yml` → `/agent-init`.
- After `git pull` in the template (or editing `global-skills/`), run `install-global.mjs` again. `--dry-run` shows what would be written.
- To bring an existing project up to the latest template, open it in Claude Code and run `/agent-update`: it pulls the template, compares versions, shows the changelog entries and a dry-run, asks, then runs `init.mjs`. (Plugin: `/agents-template:agent-update`.)

## What init creates in a project

| Path | For |
|---|---|
| `AGENTS.md` | Codex, Antigravity and other agents that read it |
| `CLAUDE.md`, `.claude/` | Claude Code (the real files) |
| `.agents/{rules,skills,agents}` | Links to `.claude/` for Antigravity/Gemini and Codex (`agents_mirror: false` disables) |
| `.codex/{rules,skills,agents}` | Links to `.claude/` for Codex (`codex_mirror: false` disables) |
| `.claude/hooks/` | Enforcing hooks for Claude Code (see Hooks below; `hooks: false` disables) |

The links are git-ignored and recreated by every init run (junctions on Windows, symlinks elsewhere).

## What is where

| Path | Purpose |
|---|---|
| `project.config.example.yml` | Fully documented example of the one file you edit |
| `core/skills/` | All skills (Laravel, React, Next.js, Vue, Node, Python, Go, Rust, Java/Kotlin, .NET, Ruby/Rails, Flutter, Swift, React Native/Expo, MySQL, Postgres, TypeScript, security, testing, ...). Always copied in full. |
| `core/agents/` | planner, architect, backend/frontend/devops engineer, debugger, code-reviewer, qa, security-reviewer, git-manager |
| `core/rules/` | Generic always-loaded rules: `CODE-QUALITY`, `SECURITY`, `TESTING`, `COMPLETION-REPORT` (~3 KB total, so teammates without personal global rules still get them; git/docs rules are generated from the config) |
| `core/skill-map.json` | Maps `type` / `stack` tokens to skills; drives the "Skill routing" section |
| `templates/` | Files with `{{placeholders}}`: AGENTS.md, CLAUDE.md, project rules, git skills (commit, push, ship, ...) |
| `global-skills/` | Sources of `/agent-setup-scaffold` and `/agent-init` |
| `install-global.mjs` | Installs those global commands for Claude Code / Codex / Antigravity |
| `init.mjs` | The generator (orchestrator) |
| `lib/` | Pure parts of the generator: `yaml.mjs` parser, `render.mjs` template engine, `scaffold.mjs` |
| `.githooks/pre-commit` | Regenerates the plugin files before each commit (`git config core.hooksPath .githooks`) |

## Config keys

`name`, `description`, `url`, `type` (web/api/mobile/fullstack/cli/library/other), `stack`, `package_manager`, `run_in_docker` + `docker.{dir,service}`, `test_command`, `branches.{working,integration,production}`, `deploy.{mode,scope,target,needs_approval}`, `commit_attribution`, `docs_language`, `docs_files`, `layout`, `local_only`, `notes`, `forbid`, `agents_mirror`, `codex_mirror` (both default on; see above), `hooks` (default true), `format_command`, `model_profile`, `token_budget`, `big_file_kb`, `context_nudge_kb`, `packages`, `statusline`, `session_context`, `mcp_allow`, `mcp_deny`. The full list with descriptions is `project.config.schema.json`.

- Empty `branches.integration` → `/merge-to-dev`, `/merge-to-main`, `/ship` are not generated.
- `forbid: [oldprojectname]` → init fails if that word appears anywhere in generated files.
- `project.config.yml` uses a YAML subset: `key: value`, nested maps, `- item` lists, inline `[a, b]` / `{a: b}`, quoted strings. Unsupported syntax (block scalars `|`/`>`, anchors/aliases, tabs, duplicate keys, unclosed quotes/brackets, multi-line flow lists) stops init with `line N: ...` instead of being silently misread.
- `notes` is where project-specific rules go; they are written into AGENTS.md, `.claude/CLAUDE.md` and ARCHITECTURE.md.

## Credit / token savers (all configurable)

| Key | Default | Effect |
|---|---|---|
| `protect_secrets` | true | `settings.json` denies the **Read tool** on `.env`, its variants (`.env.local`, `.staging`, `.development`, `.test`, ...; `.env.example` stays readable), `*.pem`, `*.key`, `id_rsa*`, `.npmrc`, `.netrc`, `~/.ssh` and `~/.aws`, and every `local_only` path, and `guard-secrets` blocks writes there. It does **not** cover shell commands: `cat .env` or `node -e` is not stopped by any rule or hook, only by your permission prompt (verified in a real run). Do not grant broad Bash allow rules such as `Bash(node *)`, and do not use `bypassPermissions`, in a project that holds secrets |
| `deny_heavy` | true | also denies Read on `vendor/`, `node_modules/`, `dist/`, `build/`, logs, `*.min.js`, `*.map` (stack-aware) |
| `allow_safe_commands` | true | `git status/diff/log` and the project test command run without a permission prompt (fewer turns) |
| `domains` | `[]` | Optional concerns (not tech stacks) that add skills on top of `type` and `stack`, `seo` (six SEO skills), `saas`, `payments`, `realtime`, `events`, `search`, `product` (discovery, PRD, delivery planning, production readiness). Names come from `domains` in `core/skill-map.json`. Unknown names warn. Skills can also declare dependencies in `core/skill-map.json` (`deps`), which are expanded automatically |
| `skills_mode` | focused | `focused` installs only skills routed for this type/stack (init never deletes skills already installed). Every run prints the skill-description token overhead; in `all` mode it also prints what `focused` would save |
| `model` | sonnet | default model written to `settings.json` if none is set (overrides `model_profile`) |
| `model_profile` | balanced | `economy`: sonnet for every agent, haiku for `git-manager`. `quality`: opus for architect/planner/debugger/security-reviewer and the main model. `balanced` keeps the agent files as written |
| `token_budget` | 0 (off) | init warns when the always-loaded context is over this many tokens |
| manual-only skills | built in | `/commit`, `/push`, `/ship`, `/merge-*`, `/pr`, `/status`, `/sync`, `/review`, `/deploy`, `/build`, `/project-init` are `disable-model-invocation: true`: their descriptions are not loaded into context, you invoke them by name (`doc-sync` stays invocable because other skills call it) |

Every init run prints the always-loaded context (instructions, rules, skill and agent descriptions; ~4 chars per token, an estimate). It is re-sent each turn but mostly served from the prompt cache, so the bigger levers are model choice, `/compact`/`/clear`, and not reading large files.

Also: always-loaded text is kept short (git procedures live in skills, loaded only when used), `git-manager` runs on `haiku`, and `.claude/CLAUDE.md` carries short context-hygiene rules. `settings.json` is merged, never replaced.

## Hooks (Claude Code)

Rules in markdown can be forgotten; hooks are run by Claude Code itself. init copies Node scripts to `.claude/hooks/` (project values in `.claude/hooks/config.json`) and registers them in `settings.json` (your own hooks are kept).

| Hook | Runs on | Does |
|---|---|---|
| `guard-bash` | Bash | **Blocks**: commit or push on `branches.production`/`integration`, force-push, `--no-verify`, and `Co-Authored-By`/"Generated with" lines when `commit_attribution` is false. **Asks**: `git reset --hard`, `git branch -D`, changing `core.hooksPath`. Also blocks `git push --mirror/--all`. It follows `env`/`sudo`/`command`, `bash -c`, `eval`, `$(...)` and backticks, but it is a best-effort guard, not a sandbox (aliases and scripts are not seen): protect `main`/`dev` with branch protection on the host |
| `guard-secrets` | Write/Edit | **Blocks** writes to `.env*` and `local_only` paths (case-insensitive, and through symlinks), and content with obvious secrets (AWS/GitHub/Slack/Google keys, private keys, `sk-…`). Needs `protect_secrets` (default true) |
| `format` | after Write/Edit | Runs `format_command "<file>"`. Only installed when `format_command` is set |
| `guard-read` | Read | **Blocks** whole-file reads above `big_file_kb` (default 100) and large lockfiles; Read with `offset`/`limit` is always allowed. `0` disables |
| `context-nudge` | each prompt | Warns the **user** (no tokens) to `/compact` or `/clear` when the transcript passes `context_nudge_kb` (default 400); repeats after 25% growth. `0` disables |

Config: `hooks: false` installs none (and removes ours from `settings.json`); `format_command` e.g. `npx prettier --write` or `vendor/bin/pint`. `test_command` and `format_command` must be one plain command (no `; & | ` $ < >` or newline, and not a shell such as `bash`): the first becomes an auto-approved permission and the second runs through a shell on every edit, so init rejects anything else before writing files. A hook that crashes reports the error (non-blocking) instead of failing silently.

## Monorepo

Add a `packages:` map (see `project.config.example.yml`; each folder must already exist). init writes a small `CLAUDE.md` into every package folder (stack, tests, the stack-specific skills, notes) and routes skills for the union of all stacks. Claude Code loads a nested `CLAUDE.md` only when it reads or edits files in that folder, so package instructions cost nothing in other parts of the repo. A package `path` must be a relative folder inside the project (no `..`, not under `.claude/`, not the project root `.`); `test_command` runs from the repo root.

## Optional extras (all off by default)

| Key | Effect |
|---|---|
| `vscode_settings: false` | Skip writing `.vscode/settings.json` (default is on, only when `.vscode/` is git-ignored): `search.useIgnoreFiles=false` etc. so the `@` picker can find git-ignored generated files |
| `statusline: true` | Status line: `[Model] folder branch \| ctx 42% \| $0.35` (context turns yellow at 60%, red at 80%). Never replaces a `statusLine` you configured yourself |
| `session_context: true` | `SessionStart` hook that hands Claude the git branch, status and last 3 commits, saving a first `git status` call; costs a few hundred tokens per session |
| `mcp_allow: [github]` | Only these `.mcp.json` servers are enabled (`enabledMcpjsonServers`, `enableAllProjectMcpServers: false`). Servers from your user settings or claude.ai connectors are not controlled by this |
| `mcp_deny: [slack]` | Denies every tool of these MCP servers (`permissions.deny` `mcp__<name>`) |

Rules with a `paths:` frontmatter (like `TESTING.md`, which loads only when test files are touched) are excluded from the "always-loaded" estimate init prints. Add the same frontmatter to your own stack-specific rules to keep them out of every session.

## Install as a Claude Code plugin

Instead of cloning and running `install-global.mjs` (which still works), install from the marketplace in this repo:

```bash
claude plugin marketplace add khmuhib01/agents-template
claude plugin install agents-template@agents-template
```

You get `/agents-template:agent-setup-scaffold`, `/agents-template:agent-init` and `/agents-template:agent-update`; they run `init.mjs` from the plugin folder. The plugin files (`skills/`, `.claude-plugin/`) are generated from `global-skills/` and `VERSION` by `node build-plugin.mjs`; `test.mjs` fails if they are stale, so run it after changing either. Checked once on Linux with Claude Code 2.1.329 (install, scaffold and init all worked); report any issue on other systems.

## Live skill-trigger eval (costs money)

### Budget-enforced task driver (prototype, opt-in)
`node orchestrate.mjs --goal "..." [--profile tiny|small|medium] [--test-cmd "..."]` runs a task as separate `claude -p` calls (plan, implement, your test command, at most one repair) on a local `orch/<id>` branch, with a hard cap on model calls and cost enforced by code before every call, a ledger in `.git/orchestrator/`, `--resume ID` and `--status ID`. It never pushes, merges or deploys, gives no model step Bash, and refuses to start on a dirty working tree. The budget numbers are untuned estimates. Measured on 3 small scenarios (9 runs per arm, Sonnet): it passed 7 of 9, baseline 8 of 9, at about 1.6 times the cost and 1.7 times the time, so it is **not recommended for small tasks** and no quality gain is claimed; what it adds is an enforced cap, resume and an audit trail (see `docs/EVALUATION-PLAN.md` section 6). `node test.mjs --only orchestrate` tests it with a fake `claude` (no cost).

`node evals/live.mjs --dry-run --limit 3` previews the request. With `ANTHROPIC_API_KEY` set, `node evals/live.mjs [--suite legacy|triggers|all] [--repeats N] [--limit N] [--model ID] [--type T --stack a,b --domains x] [--max-calls N] [--out FILE]` shows a real model the list of model-invocable skills (name + description) and scores the cases: expected skills chosen, forbidden skills not chosen, per-skill recall/precision. `--suite legacy` (default) is the original `evals/cases.json`; `all` adds `evals/triggers/*.json` (negative, multi-skill and `live-only` cases). It is an approximation of how Claude Code triggers skills, not Claude Code itself, and is never run by `test.mjs` or CI. `evals/scenarios.mjs` runs task scenarios (a fixture repo + prompt + deterministic graders for correctness, test quality, security, version compatibility and fabricated docs) with `claude -p` in a baseline arm and a skills arm; `node evals/scenarios.mjs --check` is free and verifies the graders against reference solutions. `node evals/report.mjs` writes `evals/REPORT.md` from recorded `evals/results/*.json`. `node evals/context.mjs` (free) lists the description tokens of the skills routed into every project next to the eval cases that expect them. `--arms` accepts `baseline`, `skills` and `orchestrated` (the fixture run through `orchestrate.mjs`; tested only with a fake `claude` so far); `evals/report.mjs` adds a per-arm table with cost per passing run. Eight scenarios exist; the three added after the pilot (payments webhook refund, tenant invoice isolation, migration lock safety) were run 3 times per arm: no quality difference, skills arm about 28 percent more cost per run (details in `docs/EVALUATION-PLAN.md`). One pilot is recorded in `evals/REPORT.md` (5 scenarios, 1 run per arm, Sonnet): every scenario passed in both arms, so these scenarios do not yet discriminate between the skills and no benefit is shown; the skills arm cost more per run. Trigger accuracy against a live model has not been measured.

## Safe upgrades

- **Hand-edit protection.** init records a hash of every generated file in `.claude/.template-hashes.json` (commit it). If you edit a generated file (a skill, a rule, `AGENTS.md`...), the next run **keeps your version**, reports it, and saves the new template version as `.claude/.init-backup/<time>/<file>.template` so you can merge by hand. `node init.mjs --force` overwrites them (a backup of your edit is made). `settings.json` is always merged, never skipped. Line-ending changes (git autocrlf) do not count as edits. Projects initialized before this feature have no hash file: the first run behaves as before (overwrite with backup) and starts tracking.
- **Stale cleanup.** What init generated last time but no longer generates (you switched `skills_mode` to `focused`, a skill was renamed, a package or hook was removed) would keep costing context every session, so init removes it: only files recorded in `.template-hashes.json` that are still untouched, each copied to `.claude/.init-backup/<time>/` first. A stale file you edited is kept and named in a warning (once). Skills, rules or files you created yourself are never touched, nor are folders outside `.claude/` (a removed package loses its generated `CLAUDE.md`, not the folder). `--dry-run` lists what would go and `--check` counts it as out of date. Permission rules work the same way: `settings.json` remembers the rules init wrote (`managedPermissions` in `.claude/CONFIGURATION.MANIFEST.JSON`), so changing `test_command` or turning off `protect_secrets` removes the old rule, while rules you added stay. `mcp_allow` / `mcp_deny` work the same way (`managedMcp` in the manifest): a server you drop from either is no longer enabled or denied, a server you added by hand stays. The first run after upgrading has no such record and removes no permission rule; it starts tracking.
- **Drift check for CI.** `node init.mjs --check` writes nothing and exits 1 when generated files are out of date (config changed, or the template was upgraded), 0 when in sync. Intentionally edited files do not fail it.
- **Editor validation.** `project.config.schema.json` describes every key; the first line of the example/scaffolded config points a YAML language server at it. init also warns about unknown keys with a suggestion (`skils_mode` -> `skills_mode`).

## Versioning and tests

- `VERSION` is stamped into `.claude/.template-version` and the manifest; init prints `old → new` when a project is upgraded.
- `node test.mjs` runs init against sample configs (Laravel+Docker, mobile, focused skills, forbid, invalid), every stack token in `skill-map.json` (right skills installed, other stacks' skills absent), YAML parser error cases, catalog consistency (skill/agent frontmatter, `skill-map.json` references, description length) and idempotency. CI runs it on every push.
- `node evals/run.mjs [--verbose] [--report]` is an offline skill-trigger eval: it ranks skills by word overlap between each prompt in `evals/cases.json` and `evals/triggers/*.json` and the skill descriptions, and requires an expected skill in the top 3 (and forbidden skills out of it). It guards description quality; it does not measure real model triggering. Add a case when you add or reword a skill.

## Improving the template

- Generic skill/agent/rule → edit under `core/`, then re-run init in each project.
- Wording that depends on the project → edit under `templates/` using `{{key}}`, `{{a.b}}`, `{{#if key}}...{{else}}...{{/if}}` (no nested `if`).
- New stack → add tokens to `core/skill-map.json`.

## Known gaps

- Other languages (PHP without Laravel, Elixir, C/C++, …) get only the generic skills; add a folder in `core/skills/<name>/SKILL.md` and map it in `skill-map.json`.
- `ARCHITECTURE.md` is generated from `layout` + `notes` only; for deep architecture rules, add them to `notes` or run `/project-intelligence` in the project.
