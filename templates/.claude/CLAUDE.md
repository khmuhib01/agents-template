# Project Engineering Environment

> Operating profile, engineering principles, execution autonomy, git safety, and completion report are defined in the root `CLAUDE.md` and `.claude/rules/`. This file holds only project-specific configuration. Generated from `project.config.yml`; do not edit by hand.

## Project

**{{name}}**{{#if url}} — {{url}}{{/if}}. {{description}}

Type `{{type}}`; stack: {{stack_list}}.

{{layout_list}}

## Skill routing

All skills are installed; use the ones that fit the task.

{{skill_routing}}

## Token Efficiency

- Read only the files needed; use `Grep` and line ranges.
- Use `Edit` instead of `Write` for existing files; batch independent calls.
- Do not re-read files already in context, or re-read after an edit.
- Do not load skills or spawn agents for simple tasks.
- Keep responses concise.

## Session Start

1. `git status --short --branch`.
2. Read {{docs_list}} only when the task needs setup context.

## Workflow

1. {{exec_text}}
2. {{verify_text}}
3. Commit with conventional messages; push only when explicitly asked. {{attribution_text}}
4. {{deploy_text}}
{{#if notes_list}}
## Project-specific rules

{{notes_list}}{{/if}}
