# Project Engineering Environment

> Project-specific configuration generated from `project.config.yml`; do not edit by hand. General rules: root `CLAUDE.md` and `.claude/rules/`.

## Project

**{{name}}**{{#if url}} — {{url}}{{/if}}. {{description}}

Type `{{type}}`; stack: {{stack_list}}.

{{layout_list}}

{{#if packages_list}}Packages (each has its own CLAUDE.md):

{{packages_list}}{{/if}}

## Skill routing

{{skill_routing}}

## Token Efficiency

- `Grep` first, then read line ranges; never open lockfiles, dumps or logs whole.
- `Edit`, not `Write`, for existing files; batch independent calls; no re-read after an edit; pipe long output through `head`/`tail`.
- No skills or subagents for simple tasks. `/clear` between tasks; plan first for big changes. Keep responses short.

## Workflow

1. Read {{docs_list}} only when the task needs setup context. {{exec_text}}
2. {{verify_text}}
3. Commit with conventional messages; push only when explicitly asked. {{attribution_text}}
4. {{deploy_text}}
{{#if notes_list}}
## Project-specific rules

{{notes_list}}{{/if}}
