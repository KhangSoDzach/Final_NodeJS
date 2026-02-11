# Agent Prompt Templates

##  MANDATORY RULES (Copy-paste vào ĐẦU mọi prompt)

```
"Strictly follow .agent/skills.manifest.json and only use folders under .agent/active-skills/ unless the user explicitly approves additional skills."
"If a task requires skills outside the manifest, list the missing skills and ask for explicit user approval before proceeding."
```

---

##  Templates theo loại Task

### 1 Feature Implementation (New Feature)

```
[2 dòng rule bắt buộc]

Task: [Tên feature cụ thể]
Skills: backend-architect, nodejs-backend-patterns, database-design, testing-patterns
Files to modify:
- models/[model].js
- controllers/[controller].js
- routes/[route].js
- tests/controllers/[test].test.js

Requirements:
1. Design schema (use database-design skill patterns)
2. Implement controller with async/await (nodejs-backend-patterns)
3. Add input validation (express-validator)
4. Write tests FIRST (testing-patterns)
5. Run npm test and report results

Stop and ask before adding new dependencies.
```

---

### 2 Bug Fix

```
[2 dòng rule]

Task: Fix [bug description]
Skills: error-handling-patterns, testing-patterns, [domain-skill]
Bug details:
- File: [file path]
- Line: [line number]
- Error: [error message]
- Expected: [expected behavior]

Steps:
1. Write failing test that reproduces the bug
2. Fix the issue
3. Verify test passes
4. Check no regression (run full test suite)
5. Report: npm test results
```

---

### 3 API Endpoint (REST)

```
[2 dòng rule]

Task: Add [METHOD] /api/[resource]/[path]
Skills: api-design-principles, api-security-best-practices, nodejs-backend-patterns
Endpoint spec:
- Method: GET/POST/PUT/DELETE
- Auth: required/optional
- Request body: [schema]
- Response: [schema]
- Status codes: 200, 400, 401, 404, 500

Requirements:
1. Follow REST conventions (api-design-principles)
2. Add auth middleware if needed
3. Input validation (express-validator)
4. Pagination for list endpoints
5. Error handling (error-handling-patterns)
6. Write tests (happy path + error cases)
7. Add OpenAPI documentation
8. npm test and report
```

---

### 4 Database Schema Change

```
[2 dòng rule]

Task: [Add/Modify/Remove] field [field_name] in [Model]
Skills: database-design, nosql-expert, nodejs-backend-patterns
Change details:
- Model: [model name]
- Field: [field name]
- Type: [String/Number/Date/ObjectId/Array]
- Required: yes/no
- Default: [value]
- Index: yes/no

Steps:
1. Check active-skills/database-design for MongoDB schema best practices
2. Update model with validation
3. Create migration script if needed (for existing data)
4. Update affected controllers
5. Update tests
6. Run npm test
7. Document breaking changes if any
```

---

### 5 Authentication & Authorization

```
[2 dòng rule]

Task: [Implement/Fix] authentication for [feature]
Skills: auth-implementation-patterns, api-security-best-practices, secrets-management
Requirements:
1. Check passport config (auth-implementation-patterns)
2. Validate JWT/session handling
3. Add role-based access control if needed
4. Secure password storage (bcrypt)
5. Rate limiting for sensitive endpoints
6. No secrets in code (secrets-management)
7. Add auth tests
8. npm test and report
```

---

### 6 Email System

```
[2 dòng rule]

Task: Send [email_type] email when [trigger]
Skills: email-systems, nodejs-backend-patterns
Email details:
- Type: transactional/notification
- Trigger: [event]
- Recipients: [user type]
- Template: [template name]

Steps:
1. Check active-skills/email-systems for nodemailer patterns
2. Create email template in views/emails/
3. Add email service method
4. Trigger from controller
5. Add queue if needed (for async)
6. Test email sending (mock in tests)
7. npm test and report
```

---

### 7 Payment Integration

```
[2 dòng rule]

Task: Integrate [payment_gateway] for [feature]
Skills: payment-integration, api-security-best-practices, error-handling-patterns
Gateway: Stripe/PayPal/VNPay/MoMo
Requirements:
1. Check payment-integration skill for best practices
2. Secure API key storage (env vars)
3. Webhook handler for payment status
4. Transaction logging
5. Refund handling
6. Error handling (payment failures)
7. Add tests (mock payment gateway)
8. npm test and report
```

---

### 8 Security Audit

```
[2 dòng rule]

Task: Security audit for [module/feature]
Skills: api-security-best-practices, auth-implementation-patterns, secrets-management
Scope: [controllers/auth/payment/full-app]
Checklist:
1. Input validation (SQL injection, XSS, NoSQL injection)
2. Authentication/Authorization flaws
3. Secrets exposure (hardcoded keys, tokens in logs)
4. Rate limiting on sensitive endpoints
5. CORS configuration
6. Helmet security headers
7. Dependency vulnerabilities (npm audit)

Output format:
- Finding: [description]
- Severity: Critical/High/Medium/Low
- File: [path]
- Fix: [recommendation]
```

---

### 9 Performance Optimization

```
[2 dòng rule]

Task: Optimize [feature/query/endpoint]
Skills: nosql-expert, nodejs-backend-patterns, database-design
Current issue:
- Slow query/endpoint: [path]
- Response time: [ms]
- Target: [ms]

Steps:
1. Profile the code (identify bottleneck)
2. Check database indexes (nosql-expert)
3. Add pagination if missing
4. Use lean queries for read-only data
5. Add caching if appropriate
6. Benchmark before/after
7. Run tests to ensure no regression
```

---

###  Refactoring

```
[2 dòng rule]

Task: Refactor [module/file] to [improvement]
Skills: nodejs-backend-patterns, error-handling-patterns, testing-patterns
Current issues:
- Code smell: [description]
- Duplication: [location]
- Complexity: [metric]

Goals:
1. Extract common logic to services
2. Follow DRY principle
3. Improve error handling
4. Add JSDoc comments
5. Maintain backward compatibility
6. Ensure tests pass (no regression)
7. npm test and report
```

---

### 11 Testing (Add/Fix Tests)

```
[2 dòng rule]

Task: Add tests for [feature/module]
Skills: testing-patterns, nodejs-backend-patterns
Test scope:
- File: [controller/model/service]
- Coverage target: 80%+

Test cases:
1. Happy path (success scenarios)
2. Validation errors (400)
3. Authentication errors (401)
4. Authorization errors (403)
5. Not found (404)
6. Server errors (500)
7. Edge cases (empty arrays, null values, duplicates)

Steps:
1. Read active-skills/testing-patterns/SKILL.md
2. Use existing test setup (tests/setup.js)
3. Mock external dependencies
4. Run npm test
5. Run npm run test:coverage
6. Report coverage %
```

---

### 12 Docker Optimization

```
[2 dòng rule]

Task: Optimize Docker setup for [dev/prod]
Skills: docker-expert, deployment-engineer, secrets-management
Current issues: [slow build/large image/security]

Improvements:
1. Multi-stage build (docker-expert patterns)
2. Reduce image size (alpine base, clean cache)
3. Layer caching optimization
4. Separate dev/prod compose files
5. Health check endpoint
6. Proper .dockerignore
7. Secure env var handling
8. Build and test locally

Commands to verify:
- docker build -t app:test .
- docker-compose up -d
- docker ps (check health)
```

---

### 13 CI/CD Pipeline

```
[2 dòng rule]

Task: Create/Update CI/CD pipeline
Skills: cicd-automation-workflow-automate, deployment-engineer, docker-expert
Platform: GitHub Actions/GitLab CI/Jenkins
Pipeline stages:
1. Install dependencies
2. Lint/format check
3. Run tests (npm test)
4. Build Docker image
5. Push to registry (optional)
6. Deploy to [staging/production]

Requirements:
1. Check cicd-automation-workflow-automate for pipeline patterns
2. Secrets in CI env vars (not in yaml)
3. Fail fast on test failures
4. Notification on success/failure
5. Rollback strategy
```

---

### 14 Migration to React (EJS  API)

```
[2 dòng rule]

Task: Convert [route] from EJS to REST API
Skills: react-migration, api-design-principles, api-documentation-generator
Route: /[path]
Current: res.render()
Target: res.json()

Steps:
1. Read active-skills/react-migration/SKILL.md
2. Extract data logic from controller
3. Remove res.render, add res.json
4. Keep same data structure initially
5. Add OpenAPI schema (api-documentation-generator)
6. Update/add tests (check response JSON)
7. Document breaking changes
8. npm test and report

Note: Do NOT modify view files yet (React will replace them later)
```

---

### 15 Database Migration Script

```
[2 dòng rule]

Task: Create migration script for [change]
Skills: database-design, nosql-expert, nodejs-backend-patterns
Change: [add field/rename/remove/transform data]
Affected collection: [collection_name]
Estimated docs: [count]

Script requirements:
1. Backup strategy
2. Idempotent (can run multiple times safely)
3. Progress logging
4. Rollback plan
5. Dry-run mode
6. Batch processing (for large collections)

Test on sample data first.
```

---

### 16 Monitoring & Logging Setup

```
[2 dòng rule]

Task: Add monitoring/logging for [module]
Skills: observability-monitoring-monitor-setup, error-handling-patterns
Requirements:
1. Structured logging (JSON format)
2. Log levels (error/warn/info/debug)
3. No sensitive data in logs (secrets-management)
4. Request ID for tracing
5. Performance metrics (response time)
6. Error tracking (stack traces)
7. Health check endpoint
8. Document log format
```

---

### 17 Deployment Preparation

```
[2 dòng rule]

Task: Prepare for production deployment
Skills: deployment-engineer, docker-expert, secrets-management, observability-monitoring-monitor-setup
Environment: [staging/production]

Pre-deployment checklist:
1. Environment variables validated (secrets-management)
2. Database indexes created (nosql-expert)
3. Docker image optimized (docker-expert)
4. Health check endpoint working
5. Monitoring/logging configured
6. Backup strategy in place
7. Rollback plan documented
8. Run npm test (all green)
9. Load testing (optional)
10. Create deployment runbook

Deliverables:
- Deployment runbook (.md file)
- Environment variables template (.env.example)
- Rollback procedure
```

---

### 18 Code Review Request

```
[2 dòng rule]

Task: Prepare code for review
Skills: nodejs-backend-patterns, testing-patterns, [domain-skill]
Changes:
- Feature: [name]
- Files changed: [count]
- Tests added: [count]

Self-review checklist:
1. All tests pass (npm test)
2. Code follows project patterns (nodejs-backend-patterns)
3. No console.log or debugging code
4. Error handling in place
5. Input validation complete
6. Comments for complex logic
7. No secrets in code
8. Updated documentation if needed

Ready for review: yes/no
```

---

### 19 Documentation Update

```
[2 dòng rule]

Task: Update documentation for [feature/change]
Skills: api-documentation-generator, [domain-skill]
Documents to update:
- [ ] README.md (if public API changed)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] CHANGELOG.md
- [ ] Code comments (JSDoc)
- [ ] Environment variables (.env.example)

Include:
- What changed
- Why it changed
- Migration guide (if breaking change)
- Examples
```

---

### 20 Emergency Hotfix

```
[2 dòng rule]

Task: URGENT - Fix production issue [description]
Skills: error-handling-patterns, debugging-strategies (if available), [domain-skill]
Issue:
- Severity: Critical/High
- Impact: [users affected / revenue loss / security]
- Error: [error message/log]
- File: [suspected location]

Fast track:
1. Create hotfix branch from main
2. Reproduce issue locally if possible
3. Implement minimal fix
4. Add test to prevent regression
5. npm test (must pass)
6. Skip non-critical checks
7. Deploy ASAP
8. Post-mortem analysis later

Document:
- Root cause
- Fix applied
- Monitoring added
```

---

##  Quick Reference

| Task Type | Primary Skills |
|-----------|---------------|
| Feature | backend-architect, nodejs-backend-patterns, testing-patterns |
| Bug Fix | error-handling-patterns, testing-patterns |
| API | api-design-principles, api-security-best-practices |
| Database | database-design, nosql-expert |
| Auth | auth-implementation-patterns, api-security-best-practices |
| Email | email-systems |
| Payment | payment-integration, api-security-best-practices |
| Security | api-security-best-practices, secrets-management |
| Testing | testing-patterns |
| Docker | docker-expert, deployment-engineer |
| CI/CD | cicd-automation-workflow-automate |
| Migration | react-migration, api-design-principles |
| Monitoring | observability-monitoring-monitor-setup |

---

##  Usage Tips

1. **Always start with 2 rule lines** - Non-negotiable
2. **Choose 2-4 relevant skills** - Don't overload
3. **Be specific with files** - Help agent focus
4. **Request checkpoints** - "npm test and report"
5. **Review agent's skill reading** - "Read active-skills/[skill]/SKILL.md first"

---

##  Emergency Quick Start

**Fastest template (Feature):**
```
[2 lines from top]
Task: [what]
Skills: nodejs-backend-patterns, testing-patterns
Files: [where]
Run npm test after
```

**Fastest template (Bug):**
```
[2 lines]
Fix: [what]
Skills: error-handling-patterns
File: [where], Line: [number]
Write test first, then fix
```
