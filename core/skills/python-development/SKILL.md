---
name: python-development
description: "Use for Python code: scripts, FastAPI, Django, Flask, typing, packaging (uv, poetry, pip), virtualenvs, pytest, async, and data processing. Detects the project's tooling and Python version first."
---

# Python development

Detect first: Python version (`.python-version`, `pyproject.toml`), dependency tool (uv, poetry, pip-tools, pip + requirements), framework (FastAPI, Django, Flask, none), formatter/linter/type checker (ruff, black, flake8, mypy, pyright), test runner. Use those; do not add new tools.

## Rules
- Use the project's virtualenv (`uv run`, `poetry run`, `.venv`). Never `pip install` into the global interpreter.
- Type-hint public functions using syntax the project's Python supports (`list[str]`, `X | None` on 3.10+). Use dataclasses or Pydantic for structured data.
- `pathlib` for paths, context managers for files/connections/locks, `logging` instead of `print` in application code, specific exceptions (never bare `except:`).
- No mutable default arguments, no `import *`, no side effects at import time; guard scripts with `if __name__ == "__main__":`.
- Async: no blocking I/O inside `async def` (use `asyncio.to_thread` or an async client); do not use a sync DB session in async handlers.
- FastAPI: Pydantic models for request/response, dependencies for auth and DB, `response_model`. Pydantic v1 and v2 syntax differ; check the installed version.
- Django: `select_related`/`prefetch_related` against N+1; review generated migrations and never edit applied ones; secrets from env; ask before `migrate` on a non-local DB.
- Flask: app factory, blueprints, config objects.
- Scripts and data: stream large files instead of loading them whole; never `eval` or unpickle untrusted data; `subprocess` with list args and no `shell=True` on user input.

## Verify
Formatter, linter, type checker, then `pytest -q` (narrowest first).
