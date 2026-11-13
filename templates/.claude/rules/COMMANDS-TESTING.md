# Commands and Testing Rules — {{name}}

## 1. Running commands
{{exec_text}}
{{#if run_in_docker}}
```bash
{{exec_prefix}} <command>
```

If the stack is not running, say so instead of guessing; do not start long-running services without asking.
{{/if}}
## 2. Tests
{{verify_text}}
{{#if test_command}}
```bash
{{test_cmd_full}}
```

Report exactly which commands ran and their results. Do not weaken, skip or delete a failing test to get a green run.
{{/if}}
## 3. Database
- Never run destructive database commands against shared or production data.
- Never edit an already-deployed migration; add a new one.
