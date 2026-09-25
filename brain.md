# Academia–Industry Collaboration Platform — AI Coding Agent Context

## Project Identity
- **SIH Problem ID:** SIH26044
- **Title:** Portal for Academia–Industry Collaboration for Skill Mapping, Internships & Placement
- **Project type:** Smart India Hackathon 2026, Software, Smart Automation
- **Purpose:** Evidence-based skill assessment, skill-gap analysis, opportunity matching, portfolios, mentorship and placement collaboration across students, academia and industry.

## Source-of-Truth Decisions
The product concept is based on the supplied SIH solution specification. Core roles are Student, Faculty, Placement Cell, Industry/Recruiter and Super Admin. The core pipeline is Account Setup → Skill + Topics → AI Assessment → Result + Project Score → Job Matching. Core differentiators are topic-level evidence, industry-defined requirements and explainable matching.

## Vision
Move from self-declared, resume-heavy evaluation toward an evidence-oriented, skill-based ecosystem while preserving explainability, security and modularity.

## Roles
1. Student
2. Faculty / Academician
3. Placement Cell / Institution Admin
4. Industry / Recruiter
5. Super Admin

## Core Workflow
```text
Account → Profile → Career Goal → Skills/Topics → AI Assessment
→ Validated Scoring → Topic/Skill Results → Skill Gaps
→ Learning/Project Evidence → Opportunity Matching → Application
→ Shortlisting/Feedback → Placement/Internship outcome
```

## Technology Stack
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express.js
- Database: PostgreSQL
- Authentication: Express Session + password hashing + RBAC
- AI: LLM API for question generation and answer evaluation
- External integrations: document verification APIs and DigiLocker
- Deployment: Vercel + Render

## Architecture
1. **User Layer:** responsive web portal, authentication, role-based access.
2. **Application Layer:** auth/roles, assessments, skill mapping, recommendations, marketplace, portfolio, mentorship, analytics.
3. **AI/ML Layer:** skill/resume parsing, gap analysis, recommendation support, readiness scoring, question generation, answer evaluation.
4. **Data & Integration Layer:** PostgreSQL, document storage, search/indexing where needed, external APIs, DigiLocker.
5. **Output Layer:** role-specific dashboards, analytics and reports.

## Non-Negotiable Product Principles
- Evidence over self-declaration.
- Industry defines opportunity requirements.
- Matching must explain matched, partial and missing requirements.
- Sensitive data is protected with least-privilege access.
- AI is an assistive subsystem, not an unchecked authority.
- Scoring formulas are deterministic wherever possible and documented.
- Integrations are modular.
- MVP must not be over-engineered.

## Coding Rules
- Keep frontend and backend responsibilities separate.
- Prefer modular service/controller/repository boundaries.
- Reuse React components and API clients.
- Validate all API inputs server-side.
- Use parameterized SQL/ORM-safe queries.
- Centralize error handling.
- Use environment variables for secrets.
- Keep AI logic isolated from core business logic.
- Never let raw LLM output directly control critical ranking.
- Avoid unnecessary dependencies.
- Use migrations for schema changes.
- Use consistent naming and HTTP semantics.

## Database Rules
- PostgreSQL is the system of record.
- Use foreign keys and constraints.
- Normalize shared entities; avoid duplicate source-of-truth data.
- Index important lookup/filter fields.
- Preserve assessment evidence and scoring provenance.
- Store timestamps and audit information for important mutations.

## API Rules
- REST + JSON.
- Protected endpoints require authentication and authorization.
- Use correct status codes.
- Validate request bodies, params and query strings.
- Return stable error shapes.
- Apply rate limiting to authentication, AI-triggering and abuse-prone endpoints.

## AI Rules
1. Inputs must include skill, topic, difficulty, question type, expected competency and assessment objective.
2. Prompt templates must be topic-specific.
3. Responses must conform to a schema.
4. Validate ranges, topic identity and required fields.
5. Apply fixed scoring rubrics and normalization.
6. Store score reasons/evidence and model metadata where appropriate.
7. Handle malformed output and provider failure with safe fallbacks.
8. Never expose answer keys before assessment completion.

## Security Rules
- RBAC is enforced server-side.
- Hash passwords using a modern password-hashing algorithm.
- Secure session cookies; protect session lifecycle.
- Configure CSRF protection where applicable to session-authenticated state-changing requests.
- Configure CORS narrowly.
- Validate uploads by extension, MIME, size and content where feasible.
- Do not expose private documents through predictable public URLs.
- Log security-relevant actions without logging secrets.
- No `.env` files or credentials in Git.
- Minimize personal data collection and access.

## UI Conventions
- Professional EdTech/CareerTech aesthetic.
- Responsive, accessible, data-driven and low cognitive load.
- Role-specific navigation.
- Strong hierarchy and reusable components.
- Skill evidence should be visualized with progress bars, cards, topic breakdowns and appropriate charts.
- Every asynchronous screen should define loading, empty and error states.

## Suggested Folder Structure
```text
/
├── brain.md
├── docs/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── utils/
│       └── styles/
├── backend/
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── middleware/
│       ├── validators/
│       ├── ai/
│       ├── integrations/
│       ├── db/
│       └── utils/
├── migrations/
└── tests/
```
This structure is **Recommended**, not a source requirement; preserve an existing working structure if the repository already uses another coherent organization.

## Environment Variables
At minimum, use environment variables for database connection, session secret, LLM API credentials, external integration credentials, allowed frontend origin and storage configuration. Exact names are **Proposed** and must match the implementation.

## Deployment
- Frontend target: Vercel.
- Backend target: Render.
- PostgreSQL must be hosted with secure credentials and encrypted connections where supported.
- CI/CD and infrastructure-as-code are **Recommended** if time permits.

## Testing
- Unit tests for scoring, matching and validators.
- API integration tests for authentication/RBAC and critical flows.
- Frontend tests for critical user journeys.
- AI contract tests using fixed structured fixtures.
- Security tests for authorization boundaries and file uploads.

## Current MVP Scope
P0: authentication, RBAC, student profile, skill/topic selection, AI assessment/scoring, topic-level scores, skill gaps, industry opportunities, skill-based matching, applications, candidate search, basic student/industry dashboards, PostgreSQL and secure APIs.

P1: portfolio, project score, faculty dashboard, placement dashboard, institution analytics, document verification, DigiLocker, notifications, industry feedback and mentorship.

P2/Future: advanced recommendations, advanced search, multi-campus analytics, trend prediction, curriculum recommendations, advanced learning roadmap and more integrations.

## Known Risks
- Irrelevant AI questions.
- Unequal assessment difficulty.
- AI scoring errors.
- Data exposure.
- AI/database/external API downtime.
- Malicious uploads and fake documents.
- Incorrect candidate data.
- Ranking manipulation.
- Duplicate applications.

## When Modifying the Project
1. First understand the existing architecture.
2. Do not unnecessarily rewrite working modules.
3. Preserve existing APIs unless migration is intentional.
4. Preserve database relationships.
5. Do not introduce unnecessary libraries.
6. Follow existing naming conventions.
7. Validate new inputs.
8. Authorize new protected routes.
9. Implement loading/error/empty states.
10. Update documentation when architecture changes.
11. Never expose secrets.
12. Never trust client-side authorization.
13. Never trust raw LLM output.
14. Keep scoring explainable.
15. Run regression tests after changes.

## Do-Not-Break Rules
- Do not weaken RBAC to make a feature easier.
- Do not expose another user's private profile/documents without an explicit authorized workflow.
- Do not make client-supplied scores authoritative.
- Do not bypass score validation.
- Do not silently change matching weights.
- Do not delete assessment evidence needed for explainability.
- Do not couple core business logic to one external AI provider.

## Future/Optional Boundary
Anything not explicitly required by the supplied specification—such as a particular ORM, Redis, Elasticsearch, microservices, vector databases, advanced ML models, SSO, CI/CD platform or event bus—is **Proposed/Optional** and requires architectural justification before adoption.
