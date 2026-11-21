# Commands and Testing Rules — agents-template

## 1. Running commands
Run project commands directly on the host with `npm`.

## 2. Tests
Run `node test.mjs` before marking work complete.

```bash
node test.mjs
```

Report exactly which commands ran and their results. Do not weaken, skip or delete a failing test to get a green run.

## 3. Database
- Never run destructive database commands against shared or production data.
- Never edit an already-deployed migration; add a new one.
