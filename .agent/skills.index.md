# Active Skills for this Project (Final_NodeJS)

Agent MUST prioritize and only use the following skills unless explicitly instructed otherwise.

## Core Architecture
- backend-architecture
- api-design-principles
- database-design

## Security & Auth
- auth-implementation-patterns
- api-security-best-practices

## Development & Testing
- backend-development-feature-development
- testing-patterns

## Migration & Frontend
- react-migration
- api-documentation-generator


Rules:
- Do NOT invent or pull skills outside this list unless user explicitly asks.
- When solving tasks, prefer `active-skills/` contents only.
- If a skill needs external sub-skill, ask user before using it.

Notes:
- `skills.index.md` is human-readable whitelist for reviewers and agents.
- Keep list short (10 or fewer) for less noise and higher precision.

Agent Prompt Rule (2 lines):
- "Strictly follow `.agent/skills.manifest.json` and only use folders under `.agent/active-skills/` unless the user explicitly approves additional skills."
- "If a task requires skills outside the manifest, list the missing skills and ask for explicit user approval before proceeding."
