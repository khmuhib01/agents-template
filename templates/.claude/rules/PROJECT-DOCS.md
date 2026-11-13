# Documentation Rules — {{name}}

- Canonical tracked docs: {{docs_list}}. Update them when setup, commands or behavior change.
{{#if local_only_list}}- Local-only paths, never commit or copy their secrets into tracked files: {{local_only_text}}.
{{/if}}- Do not create new doc files unless asked; prefer editing the existing ones.
- Update docs at ship time (`/commit-push`{{#if branches.integration}}, `/merge-to-dev`, `/ship`{{/if}}) via the `doc-sync` skill, not on every small edit. Plain `/commit` does not touch docs.
- Documentation language: {{docs_language}}.
