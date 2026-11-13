---
name: agent-setup-scaffold
description: Creates a draft project.config.yml in the current project from the detected stack, using the claude-template. Triggered only by /agent-setup-scaffold.
disable-model-invocation: true
---

# Agent setup: scaffold

Template folder: `D:/Muhib/claude-template` (if it is missing, tell the user and offer `git clone https://github.com/mohibbullahchefonline/claude-template.git D:/Muhib/claude-template`; do not clone without a yes).

1. Work in the current project root (the working directory). If `project.config.yml` already exists, stop and tell the user (do not overwrite).
2. Run: `node D:/Muhib/claude-template/init.mjs --scaffold` and show its short output.
3. Read the generated `project.config.yml` and fill in what can be inferred safely, without guessing:
   - `description` / `name`: from the README title or first paragraph, if present.
   - `layout`: the real top-level folders (one line each).
   - `local_only`: entries from `.gitignore` that are secrets, dumps, credentials or local scripts.
   - `docker.service`: check it against the compose file's service names.
   Leave everything uncertain (`deploy`, `branches`, `notes`) as is and say so.
4. Finish with a short checklist of the lines still marked `TODO`, and tell the user to edit the file and then run `/agent-init`.
5. Do NOT run init, and do not commit anything.
