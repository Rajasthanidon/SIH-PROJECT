# Product Requirements Document (PRD)
## Academia–Industry Collaboration Platform
**SIH Problem ID:** SIH26044  
**Status:** Hackathon Product Specification  
**Source:** Supplied SIH solution specification

## 1. Document Information
| Field | Value |
|---|---|
| Product | Academia–Industry Collaboration Platform |
| Problem | Portal for Academia–Industry Collaboration for Skill Mapping, Internships & Placement |
| Theme | Smart Automation |
| Category | Software |
| Primary users | Student, Faculty, Placement Cell, Industry, Super Admin |
| Core pipeline | Account → Skills/Topics → Assessment → Results → Matching |

## 2. Executive Summary
The platform connects students, academia and industry around measurable skills, topic-level evidence, internships/projects and placement opportunities. Students assess their competencies, understand gaps and discover relevant opportunities. Industry defines role-specific requirements and receives explainable candidate matching. Institutions monitor skill readiness, training needs and placement progress.

## 3. Problem Statement
Students need clearer visibility into required career skills, their current competency, skill gaps and relevant opportunities. Industry needs a more reliable way to identify and compare candidates beyond self-declared resumes. Academicians and placement teams need visibility into industry demand, batch skill gaps and opportunity pipelines.

## 4. Product Vision
Transform a largely self-declared, resume-driven process into an evidence-based, skill-oriented collaboration ecosystem.

## 5. Goals
- Measure skill competency at topic level.
- Identify actionable skill gaps.
- Let industry define required skills, topics and proficiency.
- Provide explainable opportunity matching.
- Connect assessment evidence, projects, internships and portfolios.
- Give institutions actionable skill-readiness analytics.
- Maintain secure role-based access.

## 6. Non-Goals
The MVP is not intended to replace complete LMS, HRIS, payroll, university ERP or a general-purpose social network. Advanced predictive hiring, automated final hiring decisions and fully autonomous AI ranking are outside the MVP.

## 7. Target Users & Personas
### Student
Needs career direction, evidence of competency, learning recommendations and opportunities.
### Industry/Recruiter
Needs role-specific candidate discovery, filtering, scorecards and application management.
### Faculty
Needs student skill visibility, gap analysis, mentorship and training coordination.
### Placement Cell
Needs student/recruiter data, drives, applications, placement tracking and analytics.
### Super Admin
Needs platform governance, taxonomy, configuration, users, integrations and auditability.

## 8. User Pain Points
- Skills are often self-declared.
- Resumes are difficult to compare consistently.
- Students lack topic-level gap visibility.
- Recruiters face large candidate pools.
- Faculty lack current industry-demand visibility.
- Placement teams need consolidated tracking.

## 9. Product Scope
Core modules: authentication/RBAC, profiles, skill taxonomy, assessment, scoring, gap analysis, opportunity marketplace, matching, applications, portfolio, dashboards, analytics, verification, notifications, mentorship and feedback according to MVP priority.

## 10. Core Features
1. Multi-role authentication.
2. Student profile and career goal.
3. Skill/topic selection.
4. AI-generated assessments.
5. Structured AI answer evaluation.
6. Topic and skill scores.
7. Skill-gap analysis.
8. Industry-defined jobs/internships/projects.
9. Explainable matching.
10. Applications and shortlists.
11. Candidate search.
12. Digital portfolio.
13. Faculty/placement analytics.
14. Document verification.

## 11. Student Requirements
- **FR-STU-001:** Register and create a profile.
- **FR-STU-002:** Select career role, skills and topics.
- **FR-STU-003:** Start an assessment configured for selected skill/topic/difficulty.
- **FR-STU-004:** Submit answers and receive validated results after completion.
- **FR-STU-005:** View topic and skill scores.
- **FR-STU-006:** View skill gaps and recommended next actions.
- **FR-STU-007:** Add projects, internships, certifications and achievements.
- **FR-STU-008:** Browse matched opportunities and apply.
- **FR-STU-009:** Track application status.
- **FR-STU-010:** View and manage a digital portfolio.

## 12. Industry Requirements
- **FR-IND-001:** Create and maintain an organization profile.
- **FR-IND-002:** Create jobs/internships/projects.
- **FR-IND-003:** Define required skills, topics, minimum proficiency and eligibility.
- **FR-IND-004:** Search/filter candidates.
- **FR-IND-005:** View evidence-based scorecards within authorization limits.
- **FR-IND-006:** Shortlist and manage applications.
- **FR-IND-007:** Provide recruiter feedback.

## 13. Faculty Requirements
- **FR-FAC-001:** View assigned/authorized students.
- **FR-FAC-002:** View skill and topic analytics.
- **FR-FAC-003:** Identify weak topics.
- **FR-FAC-004:** Recommend training.
- **FR-FAC-005:** Manage mentorship/workshop/FDP activities.
- **FR-FAC-006:** View industry skill trends where available.

## 14. Placement Cell Requirements
- **FR-PLC-001:** Import student data through CSV.
- **FR-PLC-002:** Manage students and recruiters.
- **FR-PLC-003:** Create/manage placement drives.
- **FR-PLC-004:** Track applications, shortlists and selections.
- **FR-PLC-005:** View skill-readiness and placement analytics.

## 15. Admin Requirements
- **FR-ADM-001:** Manage users and institutions.
- **FR-ADM-002:** Manage skills/topics and role permissions.
- **FR-ADM-003:** Configure AI assessment settings.
- **FR-ADM-004:** Monitor activity and audit logs.
- **FR-ADM-005:** Manage integrations/system configuration.

## 16. User Stories
- As a student, I want to assess a topic so I can understand my actual level.
- As a student, I want gaps explained so I know what to improve.
- As a recruiter, I want to define required topics so candidates are matched against the real role.
- As a recruiter, I want explanations so I can understand why a candidate matches.
- As faculty, I want department-level weak-topic analytics so I can plan training.
- As placement staff, I want centralized drives and applications so placement activity is traceable.
- As an admin, I want audit logs so sensitive changes are accountable.

## 17. Functional Requirements
The product shall enforce authentication, RBAC, profile management, skill taxonomy, assessments, structured scoring, opportunity management, matching, applications, analytics and secure data access. Detailed endpoint behavior is specified in TRD.

## 18. Non-Functional Requirements
- **NFR-SEC-001:** Protected resources require server-side authorization.
- **NFR-SEC-002:** Passwords shall never be stored in plaintext.
- **NFR-SEC-003:** Secrets shall remain outside source control/frontend bundles.
- **NFR-SEC-004:** Uploads shall have size/type validation.
- **NFR-PERF-001:** APIs should remain responsive under expected hackathon prototype load; exact SLA is **Proposed** and must be validated.
- **NFR-REL-001:** AI and external-service failures shall not corrupt assessment/application state.
- **NFR-ACC-001:** Core workflows should meet accessible interaction and keyboard-navigation expectations.

## 19. Skill Assessment Requirements
Assessment input includes skill, topic, difficulty, question type, expected competency and objective. The system generates questions, collects answers, validates AI output and maps results to topic scores. Difficulty levels must be normalized to reduce unfair comparisons.

## 20. AI Requirements
- Generate topic-specific questions.
- Evaluate answers against fixed rubrics.
- Return structured JSON.
- Validate schema and score range.
- Record strengths, weaknesses and confidence where supported.
- Fail safely when provider output is invalid/unavailable.
- AI must not directly determine critical ranking without deterministic validation.

## 21. Skill Scoring
Topic score: normalized 0–100. Skill score: weighted aggregation of topic scores. Readiness may combine assessment, project evidence, internships, certifications, academic information where applicable and industry feedback. Exact production weights are **Proposed** until validated; they must be documented and versioned.

## 22. Skill-Gap Analysis
For a target role, compare student topic/skill evidence against required minimums. Output matched, partially matched and missing requirements with recommended actions.

## 23. Matching
Opportunity fields: role, description, required skills/topics, minimum levels, eligibility, preferred skills, location, work mode, duration, stipend/salary if applicable, deadline and openings. Matching checks eligibility first, then skill/topic compatibility, then generates an explanation. Exact weights are **Proposed** and must be configurable/versioned.

## 24. Marketplace
Students browse jobs, internships and projects. Industry publishes and manages opportunities. Applications prevent duplicates and respect deadlines/eligibility.

## 25. Portfolio
Portfolio contains education, skills, topic scores, projects, internships, certifications, achievements, resume, verified documents, assessment evidence and industry feedback subject to permissions.

## 26. Analytics
Institution analytics: batch/department readiness, weak skills/topics, participation, internship/placement statistics, industry demand vs curriculum, and progress. Industry analytics: job/applications/candidate funnel. Student analytics: progress and readiness.

## 27. Notifications
Notifications are **Proposed** for assessment results, applications, shortlists, deadlines, feedback and relevant system events. Delivery channels beyond in-app/email are **Future/Optional**.

## 28. Document Verification
The solution references external verification APIs and DigiLocker. Integration must be modular. Availability and exact API contracts are external dependencies and must not be assumed.

## 29. Security
Session authentication, password hashing, RBAC, input validation, secure cookies, CSRF protection where applicable, CORS, SQL-injection prevention, XSS prevention, upload validation, secure document access, audit logs, rate limiting, environment variables and data minimization are required.

## 30. Success Metrics
Student: profile completion, assessment completion, skill improvement, application rate, internship conversion, placement conversion. Industry: time to shortlist, candidate relevance, applications, hiring conversion, manual screening reduction. Institution: gap identification, training participation, readiness, internships and collaborations. Platform: active users, assessment success, matching accuracy, application conversion, API reliability. No target improvement percentage is claimed without pilot data.

## 31. MVP Scope
### P0 — Must Have
Authentication, RBAC, profile, skill/topic selection, AI assessment/scoring, topic scores, gap analysis, opportunity creation, matching, applications, candidate search, basic dashboards, PostgreSQL, secure APIs.
### P1 — Should Have
Portfolio, project score, faculty/placement dashboards, institution analytics, verification, DigiLocker, notifications, feedback, mentorship.
### P2 — Future
Advanced recommendations/search, multi-campus analytics, trend prediction, curriculum recommendations, advanced roadmap and more integrations.

## 32. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Irrelevant AI questions | Topic-specific prompts + schema checks |
| Unequal difficulty | Difficulty taxonomy + normalization |
| AI scoring errors | Fixed rubric + structured output + review |
| Data exposure | RBAC + secure sessions/APIs + hashing |
| AI/API downtime | Safe fallback + retry where appropriate |
| Fake/malicious documents | Validation + verification workflow |
| Ranking manipulation | Deterministic validated scoring + audit logs |
| Duplicate applications | Unique application constraint |

## 33. Acceptance Criteria
- Each role can authenticate and only access authorized functions.
- Student can complete a skill/topic assessment and receive validated topic scores.
- Skill gaps are derived from evidence and role requirements.
- Industry can define opportunity requirements and search candidates.
- Match results explain matched/partial/missing requirements.
- Student can apply and see application state.
- Sensitive records are protected by server-side authorization.
- AI failures do not create unvalidated scores.
- Core database/API flows are tested.
- Documentation remains consistent with implementation.
