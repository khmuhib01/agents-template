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

## Common pitfalls
- Mutable default arguments (`def f(x=[])`) are shared between calls; use `None` and create inside. Closures in loops bind late.
- Bare `except:` or a broad `except Exception: pass` hides real failures; catch the specific error and log or re-raise.
- Datetimes: keep them timezone-aware (`datetime.now(timezone.utc)`); `utcnow()` is deprecated since 3.12. Pass `encoding="utf-8"` to `open()` (Windows defaults differ).
- Async: a blocking call inside `async def` stalls the whole loop (use `asyncio.to_thread` or an async library); a missing `await` only produces a "coroutine was never awaited" warning.
- FastAPI: plain `def` endpoints run in a threadpool, `async def` on the event loop. Use `response_model` so extra fields never leak. Pydantic v1 and v2 differ (`model_validate`/`model_dump` vs `parse_obj`/`dict`): check the installed major.
- Django: fix N+1 with `select_related`/`prefetch_related`; use `F()` and `transaction.atomic` for concurrent updates; never edit an applied migration.
- Do not `pip install` into the global interpreter; use the project's venv or `uv`, and respect `requires-python`.
- pytest: use fixtures and `tmp_path`/`monkeypatch`, `parametrize` for tables, and no shared mutable state between tests.

## Verify
Formatter, linter, type checker, then `pytest -q` (narrowest first).
