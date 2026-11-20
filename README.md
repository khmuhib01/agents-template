# claude-template

One config file per project → generates `AGENTS.md`, `CLAUDE.md` and `.claude/` (rules, skills, agents) for that project.

## Use it in a new project

```bash
cd <your-project>
node <path-to>/agents-template/init.mjs --scaffold   # writes a draft project.config.yml from the detected stack
# edit project.config.yml (the only file you touch), then:
node <path-to>/agents-template/init.mjs              # generate
```

Re-run `init.mjs` any time: after editing the config, or after improving the template (it refreshes the generic parts in every project). Files it changes are first backed up to `.claude/.init-backup/<timestamp>/` (add that folder to `.gitignore`). `--dry-run` shows what would change.

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

## What init creates in a project

| Path | For |
|---|---|
| `AGENTS.md` | Codex, Antigravity and other agents that read it |
| `CLAUDE.md`, `.claude/` | Claude Code (the real files) |
| `.agents/{rules,skills,agents}` | Links to `.claude/` for Antigravity/Gemini and Codex (`agents_mirror: false` disables) |
| `.codex/{rules,skills,agents}` | Links to `.claude/` for Codex (`codex_mirror: false` disables) |

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
| `init.mjs` | The generator |

## Config keys

`name`, `description`, `url`, `type` (web/api/mobile/fullstack/cli/library/other), `stack`, `package_manager`, `run_in_docker` + `docker.{dir,service}`, `test_command`, `branches.{working,integration,production}`, `deploy.{mode,scope,target,needs_approval}`, `commit_attribution`, `docs_language`, `docs_files`, `layout`, `local_only`, `notes`, `forbid`, `agents_mirror`, `codex_mirror` (both default on; see above).

- Empty `branches.integration` → `/merge-to-dev`, `/merge-to-main`, `/ship` are not generated.
- `forbid: [oldprojectname]` → init fails if that word appears anywhere in generated files.
- `project.config.yml` uses a YAML subset: `key: value`, nested maps, `- item` lists, inline `[a, b]` / `{a: b}`, quoted strings. Unsupported syntax (block scalars `|`/`>`, anchors/aliases, tabs, duplicate keys, unclosed quotes/brackets, multi-line flow lists) stops init with `line N: ...` instead of being silently misread.
- `notes` is where project-specific rules go; they are written into AGENTS.md, `.claude/CLAUDE.md` and ARCHITECTURE.md.

## Credit / token savers (all configurable)

| Key | Default | Effect |
|---|---|---|
| `protect_secrets` | true | `settings.json` denies Read on `.env` and every `local_only` path (dumps never enter context) |
| `deny_heavy` | true | also denies Read on `vendor/`, `node_modules/`, `dist/`, `build/`, logs, `*.min.js`, `*.map` (stack-aware) |
| `allow_safe_commands` | true | `git status/diff/log` and the project test command run without a permission prompt (fewer turns) |
| `skills_mode` | all (`--scaffold` drafts write `focused`) | `focused` installs only skills routed for this type/stack (init never deletes skills already installed). Every run prints the skill-description token overhead and what `focused` would save |
| `model` | sonnet | default model written to `settings.json` if none is set |

Also: always-loaded text is kept short (git procedures live in skills, loaded only when used), `git-manager` runs on `haiku`, and `.claude/CLAUDE.md` carries short context-hygiene rules. `settings.json` is merged, never replaced.

## Versioning and tests

- `VERSION` is stamped into `.claude/.template-version` and the manifest; init prints `old → new` when a project is upgraded.
- `node test.mjs` runs init against sample configs (Laravel+Docker, mobile, focused skills, forbid, invalid), every stack token in `skill-map.json` (right skills installed, other stacks' skills absent), YAML parser error cases, catalog consistency (skill/agent frontmatter, `skill-map.json` references, description length) and idempotency. CI runs it on every push.
- `node evals/run.mjs [--verbose]` is an offline skill-trigger eval: it ranks skills by word overlap between each prompt in `evals/cases.json` and the skill descriptions, and requires an expected skill in the top 3. It guards description quality; it does not measure real model triggering. Add a case when you add or reword a skill.

## Improving the template

- Generic skill/agent/rule → edit under `core/`, then re-run init in each project.
- Wording that depends on the project → edit under `templates/` using `{{key}}`, `{{a.b}}`, `{{#if key}}...{{else}}...{{/if}}` (no nested `if`).
- New stack → add tokens to `core/skill-map.json`.

## Known gaps

- Other languages (PHP without Laravel, Elixir, C/C++, …) get only the generic skills; add a folder in `core/skills/<name>/SKILL.md` and map it in `skill-map.json`.
- `ARCHITECTURE.md` is generated from `layout` + `notes` only; for deep architecture rules, add them to `notes` or run `/project-intelligence` in the project.
