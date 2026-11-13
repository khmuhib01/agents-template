# claude-template

One config file per project → generates `AGENTS.md`, `CLAUDE.md` and `.claude/` (rules, skills, agents) for that project.

## Use it in a new project

```bash
cd <your-project>
node D:/Muhib/claude-template/init.mjs --scaffold   # writes a draft project.config.yml from the detected stack
# edit project.config.yml (the only file you touch), then:
node D:/Muhib/claude-template/init.mjs              # generate
```

Re-run `init.mjs` any time: after editing the config, or after improving the template (it refreshes the generic parts in every project). Files it changes are first backed up to `.claude/.init-backup/<timestamp>/` (add that folder to `.gitignore`). `--dry-run` shows what would change.

Requires Node 18+. No dependencies.

## What is where

| Path | Purpose |
|---|---|
| `project.config.example.yml` | Fully documented example of the one file you edit |
| `core/skills/` | All skills (Laravel, React, Next.js, Vue, Node, Python, React Native/Expo, MySQL, Postgres, TypeScript, security, testing, ...). Always copied in full. |
| `core/agents/` | architect, backend/frontend engineer, code-reviewer, qa, security-reviewer, git-manager |
| `core/rules/` | Generic rules not already in `~/.claude/rules` (global security/testing/code-quality/git rules are not duplicated) |
| `core/skill-map.json` | Maps `type` / `stack` tokens to skills; drives the "Skill routing" section |
| `templates/` | Files with `{{placeholders}}`: AGENTS.md, CLAUDE.md, project rules, git skills (commit, push, ship, ...) |
| `init.mjs` | The generator |

## Config keys

`name`, `description`, `url`, `type` (web/api/mobile/fullstack), `stack`, `package_manager`, `run_in_docker` + `docker.{dir,service}`, `test_command`, `branches.{working,integration,production}`, `deploy.{mode,scope,target,needs_approval}`, `commit_attribution`, `docs_language`, `docs_files`, `layout`, `local_only`, `notes`, `forbid`, `agents_mirror` (default on: creates `.agents/` links, git-ignored, recreated by every init run).

- Empty `branches.integration` → `/merge-to-dev`, `/merge-to-main`, `/ship` are not generated.
- `forbid: [oldprojectname]` → init fails if that word appears anywhere in generated files.
- `notes` is where project-specific rules go; they are written into AGENTS.md, `.claude/CLAUDE.md` and ARCHITECTURE.md.

## Credit / token savers (all configurable)

| Key | Default | Effect |
|---|---|---|
| `protect_secrets` | true | `settings.json` denies Read on `.env` and every `local_only` path (dumps never enter context) |
| `deny_heavy` | true | also denies Read on `vendor/`, `node_modules/`, `dist/`, `build/`, logs, `*.min.js`, `*.map` (stack-aware) |
| `allow_safe_commands` | true | `git status/diff/log` and the project test command run without a permission prompt (fewer turns) |
| `skills_mode` | all | `focused` installs only skills routed for this type/stack (init never deletes skills already installed) |
| `model` | sonnet | default model written to `settings.json` if none is set |

Also: always-loaded text is kept short (git procedures live in skills, loaded only when used), `git-manager` runs on `haiku`, and `.claude/CLAUDE.md` carries short context-hygiene rules. `settings.json` is merged, never replaced.

## Versioning and tests

- `VERSION` is stamped into `.claude/.template-version` and the manifest; init prints `old → new` when a project is upgraded.
- `node test.mjs` runs init against sample configs (Laravel+Docker, mobile, focused skills, forbid, invalid) and checks files, settings, placeholders and idempotency. CI runs it on every push.

## Improving the template

- Generic skill/agent/rule → edit under `core/`, then re-run init in each project.
- Wording that depends on the project → edit under `templates/` using `{{key}}`, `{{a.b}}`, `{{#if key}}...{{else}}...{{/if}}` (no nested `if`).
- New stack → add tokens to `core/skill-map.json`.

## Known gaps

- No Flutter/Kotlin/Swift skill yet; add a folder in `core/skills/<name>/SKILL.md` and map it in `skill-map.json`.
- `ARCHITECTURE.md` is generated from `layout` + `notes` only; for deep architecture rules, add them to `notes` or run `/project-intelligence` in the project.
