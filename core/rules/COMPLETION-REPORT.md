---
description: Completion Report Standard
always_on: true
---

# Completion Report Standard

After completing any phase, task, or feature, always provide two sections:

## 1. What Changed (Technical Summary)
- Files modified and why
- Key logic or architecture decisions
- Tests, lint, build results actually run
- Known limitations or follow-up work
- Git actions taken

## 2. User Journey Testing Guide (Human QA)
Walk the user through testing the feature as a real end-user. For every significant interaction:

**Format for each journey step:**
```
Step N — <what the user does>
  → Go to: <URL or screen path>
  → Action: <click/fill/submit what>
  → Input: <exact sample data if needed>
  → Expected: <what should appear or happen>
  → Edge case (if any): <what to try to confirm validation/error handling>
```

**Rules:**
- Cover the happy path first, then at least one error/edge case per feature.
- Use realistic sample data (e.g. a real-looking exam name, a valid phone number format).
- If the feature is behind a login or role gate, state which user role to use.
- If multiple roles see different things (e.g. student vs admin), show both journeys.
- Include any prerequisite state (e.g. "first create an exam, then...").
- Keep steps numbered and sequential so the user can follow top-to-bottom without re-reading.

**This section is mandatory** — do not skip it even for small changes. If a change has no user-facing effect, write: "No user-facing journey — internal/backend only."
