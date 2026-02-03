# Auto-Setup Skills for New Project

##  Mục đích
File này chứa prompt để agent tự động setup skills whitelist cho bất kỳ project mới nào, tiết kiệm thời gian setup thủ công.

---

##  Prompt để Agent Tự động Setup (Copy toàn bộ)

```
You are setting up a skill-based development environment for a new project.

TASK: Analyze the project, select relevant skills, and create the complete `.agent/` folder structure.

MANDATORY RULES (for all future interactions):
"Strictly follow .agent/skills.manifest.json and only use folders under .agent/active-skills/ unless the user explicitly approves additional skills."
"If a task requires skills outside the manifest, list the missing skills and ask for explicit user approval before proceeding."

---

STEP 1: Analyze Project
Read these files to understand the project:
- package.json (if Node.js)
- requirements.txt or pyproject.toml (if Python)
- pom.xml or build.gradle (if Java)
- go.mod (if Go)
- Gemfile (if Ruby)
- composer.json (if PHP)
- Cargo.toml (if Rust)
- README.md
- Any docker-compose.yml or Dockerfile

Extract:
1. Programming language(s)
2. Framework(s) (Express, Django, Spring Boot, etc.)
3. Database(s) (MongoDB, PostgreSQL, MySQL, etc.)
4. Key features (auth, payment, email, search, etc.)
5. Infrastructure (Docker, Kubernetes, serverless, etc.)
6. Current phase (development/testing/production)
7. Future plans (migration, scaling, deployment)

---

STEP 2: Scan Available Skills
List all folders in `.agent/skills/skills/` (if exists) or recommend downloading from:
https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools/tree/main/.agent/skills/skills

Categorize skills by:
- Backend/Frontend frameworks
- Database technologies
- Security & Auth
- Testing & Quality
- DevOps & Deployment
- Business features (payment, email, notifications)

---

STEP 3: Select Relevant Skills
Based on project analysis, select 15-25 skills covering:

**Core Development (5-8 skills):**
- Language-specific patterns (nodejs-backend-patterns, python-patterns, etc.)
- Framework expert (express, django-pro, spring-boot, etc.)
- API design (api-design-principles, graphql, etc.)
- Architecture (backend-architect, microservices-patterns, etc.)
- Error handling (error-handling-patterns)

**Database (2-3 skills):**
- Database design (database-design)
- DB-specific expert (nosql-expert, postgres-best-practices, etc.)
- Migrations (database-migration)

**Security & Auth (2-3 skills):**
- Auth patterns (auth-implementation-patterns)
- Security best practices (api-security-best-practices)
- Secrets management (secrets-management)

**Testing (1-2 skills):**
- Testing patterns (testing-patterns, e2e-testing-patterns)
- TDD workflow (tdd-workflow) - if applicable

**Business Features (2-4 skills, project-specific):**
- Email systems (email-systems) - if needed
- Payment integration (payment-integration, stripe-integration) - if needed
- Search (algolia-search, elasticsearch) - if needed
- Real-time (websocket patterns) - if needed

**Frontend (2-3 skills, if applicable):**
- React/Vue/Angular patterns
- State management
- UI/UX best practices

**DevOps & Deployment (3-5 skills):**
- Docker (docker-expert)
- CI/CD (cicd-automation-workflow-automate)
- Deployment (deployment-engineer)
- Monitoring (observability-monitoring-monitor-setup)
- Cloud-specific (aws-skills, gcp-cloud-run, azure-functions) - if needed

**Migration/Modernization (1-2 skills, if planning migration):**
- Legacy modernizer
- Framework migration
- React migration

---

STEP 4: Create `.agent/` Folder Structure
Create or ensure these paths exist:
- `.agent/`
- `.agent/active-skills/`
- `.agent/skills/skills/` (or clone from GitHub)

---

STEP 5: Copy Selected Skills
For each selected skill, copy from `.agent/skills/skills/[skill-name]/` to `.agent/active-skills/[skill-name]/`

PowerShell command template:
```powershell
$skills = @('skill1','skill2','skill3')
foreach ($s in $skills) {
  $src = ".agent\skills\skills\$s"
  $dest = ".agent\active-skills\$s"
  if (Test-Path $src) {
    Copy-Item -Path $src -Destination $dest -Recurse -Force
    Write-Output "Copied: $s"
  } else {
    Write-Output "MISSING: $s (needs to be downloaded)"
  }
}
```

---

STEP 6: Create `skills.manifest.json`
Generate manifest with selected skills:

```json
{
  "project": "[PROJECT_NAME]",
  "allowedSkills": [
    "skill-1",
    "skill-2",
    "skill-3"
  ],
  "rules": {
    "autoMatch": true,
    "allowFallback": false,
    "useActiveSkillsFolder": true
  }
}
```

Save to: `.agent/skills.manifest.json`

---

STEP 7: Create `skills.index.md`
Generate human-readable whitelist organized by category:

```markdown
# Active Skills for this Project ([PROJECT_NAME])

Agent MUST prioritize and only use the following skills unless explicitly instructed otherwise.

## Core Development
- [skill-1]
- [skill-2]

## Database
- [skill-3]

## Security & Auth
- [skill-4]

## Testing
- [skill-5]

## Business Features
- [skill-6]

## DevOps & Deployment
- [skill-7]

Rules:
- Do NOT invent or pull skills outside this list unless user explicitly asks.
- When solving tasks, prefer `active-skills/` contents only.
- If a skill needs external sub-skill, ask user before using it.

Notes:
- `skills.index.md` is human-readable whitelist for reviewers and agents.
- Keep list short (15-25) for less noise and higher precision.

Agent Prompt Rule (2 lines):
- "Strictly follow `.agent/skills.manifest.json` and only use folders under `.agent/active-skills/` unless the user explicitly approves additional skills."
- "If a task requires skills outside the manifest, list the missing skills and ask for explicit user approval before proceeding."
```

Save to: `.agent/skills.index.md`

---

STEP 8: Create `prompt-templates.md`
Copy the template structure from reference project or generate with 20 common templates:

1. Feature Implementation
2. Bug Fix
3. API Endpoint
4. Database Schema Change
5. Authentication & Authorization
6. Email System
7. Payment Integration
8. Security Audit
9. Performance Optimization
10. Refactoring
11. Testing
12. Docker Optimization
13. CI/CD Pipeline
14. Migration (if applicable)
15. Database Migration Script
16. Monitoring & Logging
17. Deployment Preparation
18. Code Review Request
19. Documentation Update
20. Emergency Hotfix

Each template must start with:
```
[2 dòng rule bắt buộc]

Task: [description]
Skills: [relevant-skills]
Requirements: [checklist]
```

Save to: `.agent/prompt-templates.md`

Full template content available at: [reference to Final_NodeJS project]

---

STEP 9: Create `agent-rules.txt`
Simple 2-line rule file for quick reference:

```
"Strictly follow .agent/skills.manifest.json and only use folders under .agent/active-skills/ unless the user explicitly approves additional skills."
"If a task requires skills outside the manifest, list the missing skills and ask for explicit user approval before proceeding."
```

Save to: `.agent/agent-rules.txt`

---

STEP 10: Update Project README
Add section to README.md:

```markdown
## Agent Prompt Template

When invoking an AI agent to work on this repository, start the prompt with the following two lines (copy-paste exactly):

"Strictly follow .agent/skills.manifest.json and only use folders under .agent/active-skills/ unless the user explicitly approves additional skills."

"If a task requires skills outside the manifest, list the missing skills and ask for explicit user approval before proceeding."

Usage: paste these two lines at the top of the agent prompt to enforce the project's skill whitelist.
```

---

STEP 11: Create `.gitignore` entry (optional)
Add to project `.gitignore` if needed:

```
# Agent skills (large folder)
.agent/skills/skills/
# Keep only active-skills and config
!.agent/active-skills/
!.agent/*.md
!.agent/*.json
!.agent/*.txt
```

---

STEP 12: Generate Summary Report
Output a markdown summary:

```markdown
# Skills Setup Complete

## Project Analysis
- Language: [detected]
- Framework: [detected]
- Database: [detected]
- Key Features: [list]
- Phase: [development/production]

## Skills Selected ([count] total)
### Core Development ([count])
- skill-1
- skill-2

### Database ([count])
- skill-3

### Security & Auth ([count])
- skill-4

### Testing ([count])
- skill-5

### Business Features ([count])
- skill-6

### DevOps ([count])
- skill-7

## Files Created
-  `.agent/active-skills/` ([count] skills copied)
-  `.agent/skills.manifest.json`
-  `.agent/skills.index.md`
-  `.agent/prompt-templates.md`
-  `.agent/agent-rules.txt`
-  `README.md` (updated)

## Next Steps
1. Review selected skills in `.agent/skills.index.md`
2. Add/remove skills as needed
3. Start using prompt templates from `.agent/prompt-templates.md`
4. Always prefix agent prompts with 2 mandatory rules

## Quick Start Example
```
[paste 2 rules from agent-rules.txt]

Task: [your first task]
Skills: [relevant skills from manifest]
Requirements: [what you need]
```
```

---

END OF SETUP PROCESS
```

---

##  Manual Adjustments (Optional)

After agent completes setup, you can:

1. **Review skills**: Check `.agent/skills.index.md` and remove unnecessary ones
2. **Add missing skills**: If you know you need specific skills (e.g., Stripe), add them
3. **Update manifest**: Edit `.agent/skills.manifest.json` to match changes
4. **Customize templates**: Modify `.agent/prompt-templates.md` for project-specific needs

---

##  Example Usage for New Project

**Scenario:** Setting up a Python FastAPI project with PostgreSQL and React frontend

**Prompt to agent:**
```
[Copy entire "Prompt để Agent Tự động Setup" section above]

Additional context:
- This is a Python FastAPI project
- Database: PostgreSQL
- Frontend: React (separate repo, but will need API docs)
- Features: User auth (JWT), payment (Stripe), email notifications
- Infrastructure: Docker, will deploy to AWS ECS
- Currently in development phase, planning production in 2 months
```

**Agent will:**
1. Detect Python, FastAPI, PostgreSQL, React, Docker, AWS
2. Select skills like: `fastapi-pro`, `postgres-best-practices`, `api-design-principles`, `auth-implementation-patterns`, `stripe-integration`, `email-systems`, `docker-expert`, `aws-skills`, `react-best-practices`, `api-documentation-generator`, etc.
3. Create all necessary files
4. Output summary report

**Result:** Complete `.agent/` folder ready to use in 2-3 minutes

---

##  Benefits

 **Reusable**: Use same prompt for any new project  
 **Consistent**: Same structure across all projects  
 **Fast**: 2-3 minutes setup vs 30+ minutes manual  
 **Smart**: Agent analyzes project and selects relevant skills  
 **Flexible**: Easy to adjust after initial setup  
 **Team-friendly**: Everyone uses same skill set  

---

##  Updating Skills for Existing Project

If project evolves (e.g., adding payment feature), use this prompt:

```
[2 mandatory rules]

Task: Update skills for new feature
Current project: [description]
New feature: [payment/search/real-time/etc.]
Current skills: see .agent/skills.index.md

Steps:
1. Review current manifest
2. Suggest new skills needed for [feature]
3. Copy new skills to active-skills/
4. Update skills.manifest.json
5. Update skills.index.md
6. Report changes
```

---

##  Backup & Sharing

**To share setup with team:**
```powershell
# Compress .agent folder (excluding large skills repo)
Compress-Archive -Path .agent\active-skills,.agent\*.md,.agent\*.json,.agent\*.txt -DestinationPath agent-setup.zip
```

**To restore:**
```powershell
Expand-Archive -Path agent-setup.zip -DestinationPath .agent\
```

---

##  Troubleshooting

**Issue:** Agent selects too many/few skills  
**Fix:** After setup, manually edit `.agent/skills.index.md` and `.agent/skills.manifest.json`

**Issue:** Skill not found in `.agent/skills/skills/`  
**Fix:** Download missing skill or use generic alternative

**Issue:** Agent doesn't follow skills  
**Fix:** Ensure 2 mandatory rules are at top of every prompt

**Issue:** Need project-specific skill not in catalog  
**Fix:** Create custom skill folder in `.agent/active-skills/[custom-skill]/` with `SKILL.md`

---

##  References

- Original skills catalog: https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools
- Example setup: See `Final_NodeJS` project `.agent/` folder
- Prompt templates: `.agent/prompt-templates.md`

---

##  Pro Tips

1. **Run setup at project start**: Don't wait until mid-project
2. **Review bi-weekly**: Remove unused skills, add new ones as needed
3. **Use templates**: Don't write prompts from scratch, use templates
4. **Checkpoint often**: After 3-5 file changes, ask agent to run tests
5. **Document custom rules**: If project has unique patterns, add to skills.index.md notes

---

##  Advanced: Custom Skill Creation

If you need a skill not in catalog:

1. Create folder: `.agent/active-skills/my-custom-skill/`
2. Add `SKILL.md`:
```markdown
# My Custom Skill

## Purpose
[what this skill helps with]

## Patterns
[code patterns, conventions, best practices]

## Examples
[code examples]

## Resources
[links, docs]
```
3. Add to manifest and index
4. Agent will read and follow it

---

**Last Updated:** 2026-02-03  
**Version:** 1.0  
**Tested with:** Claude Sonnet 4, GPT-4, Copilot Agent  
