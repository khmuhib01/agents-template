# Documentation Rules — agents-template

- Canonical tracked docs: `README.md`. Update them when setup, commands or behavior change.
- Local-only paths, never commit or copy their secrets into tracked files: `.env`.
- Do not create new doc files unless asked; prefer editing the existing ones.
- Update docs at ship time (`/commit-push`, `/merge-to-dev`, `/ship`) via the `doc-sync` skill, not on every small edit. Plain `/commit` does not touch docs.
- Documentation language: English.
