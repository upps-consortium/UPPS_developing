# AGENTS

## Overview
This repository contains the working files for the **Unified Personality Profile Standard (UPPS)**. It includes persona examples, prompt templates, specification documents and supporting tools.

## Directory layout
- `persona_lib/` – Sample personas and templates (including medical personas).
- `prompting/` – Guides and templates for applying personas to LLMs.
- `tools/` – Browser tools and scripts (`editor`, `validator`, `chat-app`, etc.).
- `specification/` – Formal specs and schema definitions.
- `utils/` – JavaScript utilities and tests.
- `project_todo/` – Planning and roadmap documents.

## Development guidelines
- JavaScript uses **ES modules** (`import`/`export`) and 4‑space indentation.
- YAML persona files use **two‑space indentation** and `snake_case` keys.
- Keep Markdown readable (wrap at ~100 chars when possible).

## Testing & validation
- Run Jest tests after changes to JS files:
  ```bash
  npm test
  ```
- When editing persona YAML files, validate them with:
  ```bash
  python tools/validator/upps_validator.py path/to/persona.yaml --all
  ```
- Browser tools under `tools/` require a local HTTP server, e.g.:
  ```bash
  python3 -m http.server 8000
  # or
  npx http-server -p 8000
  ```

## Commit & PR
- Use clear, imperative commit messages in **English**.
- Keep commits focused and run all tests/validators before committing.
- PR descriptions should summarize changes and mention test results.

