# Application Flow
## Academia–Industry Collaboration Platform — SIH26044

## 1. Global Application Flow
```mermaid
flowchart TD
  A[Landing] --> B[Register/Login]
  B --> C{Role}
  C --> S[Student]
  C --> F[Faculty]
  C --> P[Placement Cell]
  C --> I[Industry]
  C --> AD[Super Admin]
```

## 2. Authentication Flow
```mermaid
flowchart TD
  A[Login] --> V[Validate credentials]
  V -->|Invalid| E[Safe error + retry]
  V -->|Valid| S[Create/rotate session]
  S --> R[Load role + permissions]
  R --> D[Role Dashboard]
  D --> X[Logout/Expiry]
  X --> I[Invalidate session]
```

## 3. Student Flow
```mermaid
flowchart TD
  A[Register] --> B[Student profile]
  B --> C[Career goal]
  C --> D[Select skills/topics]
  D --> E[Assessment]
  E --> F[Results]
  F --> G[Skill gaps]
  G --> H[Learning/project evidence]
  H --> I[Browse opportunities]
  I --> J[Match explanation]
  J --> K[Apply]
  K --> L[Track application]
```

## 4. Assessment Flow
**Trigger:** Student starts an assessment.
1. Frontend requests assessment configuration.
2. Backend validates student permissions and selected skill/topic.
3. Assessment service invokes AI question-generation adapter.
4. Response is schema-validated.
5. Questions are persisted with configuration/version metadata.
6. Frontend displays the assessment.
7. Student submits answers.
8. Backend validates attempt state and answer payload.
9. Evaluation service invokes AI scoring adapter.
10. Scores are validated, normalized and persisted.
11. Frontend displays results only after completion.

## 5. AI Question Generation Flow
```mermaid
flowchart LR
  C[Skill + Topic + Difficulty + Objective] --> P[Prompt Template]
  P --> AI[LLM]
  AI --> V[Schema Validation]
  V -->|Valid| Q[Persist Questions]
  V -->|Invalid| R[Retry/Fallback]
  R -->|Still invalid| E[Safe Error]
```

## 6. AI Scoring Flow
```mermaid
flowchart LR
  A[Student Answer] --> P[Rubric Prompt]
  P --> AI[LLM]
  AI --> V[Validate JSON/range/topic]
  V --> N[Normalize]
  N --> DB[Persist Evidence]
```

## 7. Skill Calculation Flow
```mermaid
flowchart TD
  T[Validated topic scores] --> N[Normalize 0–100]
  N --> W[Weighted topic aggregation]
  W --> S[Skill score]
  S --> R[Readiness inputs]
  R --> RS[Readiness score]
```
Exact weights are **Proposed** and must be versioned.

## 8. Skill Gap Flow
Target role requirements → compare required skill/topic minimums against validated student evidence → classify matched/partial/missing → identify highest-impact gaps → map to learning/project recommendations.

## 9. Recommendation Flow
```mermaid
flowchart TD
  G[Skill gaps] --> C[Candidate learning/project content]
  R[Role requirements] --> C
  C --> F[Eligibility/relevance filters]
  F --> O[Ordered recommendations]
```
Advanced ML recommendations are Future Scope; deterministic rules are sufficient for MVP.

## 10. Job Matching Flow
```mermaid
flowchart TD
  J[Opportunity] --> E[Eligibility]
  C[Candidate] --> E
  E -->|Eligible| SK[Skill match]
  SK --> TP[Topic match]
  TP --> EV[Evidence/project match]
  EV --> M[Match calculation]
  M --> EX[Explainable breakdown]
  EX --> UI[Opportunity/Candidate UI]
  E -->|Ineligible| NI[Not eligible]
```

## 11. Internship Flow
Industry creates internship → defines requirements → publishes → eligible students discover → match explanation → apply → recruiter review → shortlist → feedback/status → outcome.

## 12. Application Flow
```mermaid
flowchart TD
  A[Opportunity detail] --> E{Eligible?}
  E -->|No| N[Explain missing eligibility]
  E -->|Yes| D{Already applied?}
  D -->|Yes| X[Show existing application]
  D -->|No| C[Submit application]
  C --> S[Persist application]
  S --> T[Notify/track]
```

## 13. Portfolio Flow
Student adds education/project/certification/evidence → validation → save → optional verification → portfolio renders authorized evidence.

## 14. Industry Flow
```mermaid
flowchart TD
  A[Industry login] --> B[Company verification/profile]
  B --> C[Create opportunity]
  C --> D[Define skills/topics/eligibility]
  D --> E[Publish]
  E --> F[Candidate matching]
  F --> G[Filter/search]
  G --> H[Scorecard]
  H --> I[Shortlist]
  I --> J[Contact/interview]
  J --> K[Application status]
  K --> L[Feedback]
```

## 15. Faculty Flow
Login → dashboard → select department/authorized students → inspect skill analytics → identify gaps → recommend training → mentorship/workshops → track progress.

## 16. Placement Cell Flow
Login → dashboard → import student data → manage students/recruiters → create drive → publish opportunity → monitor applications → shortlist/selection → placement tracking → analytics.

## 17. Admin Flow
Login → dashboard → user management → institution management → skill/topic taxonomy → AI configuration → integrations → audit logs → analytics/system settings.

## 18. Document Verification Flow
```mermaid
flowchart TD
  U[Upload/link document] --> V[File validation]
  V -->|Invalid| E[Reject safely]
  V -->|Valid| S[Private storage]
  S --> R[Verification request]
  R --> API[External verification/DigiLocker]
  API --> O[Validate response]
  O --> DB[Persist verification status]
  DB --> UI[Authorized display]
```

## 19. Notification Flow
Event occurs → backend creates notification → user sees in-app notification. Email/other delivery is **Optional**. Notification creation must not break the primary transaction.

## 20. Error Flows
### Invalid login
Show generic credential failure; do not disclose whether an account exists beyond the chosen authentication policy.
### Duplicate registration
Show field-level guidance and recovery path.
### Incomplete profile
Block only workflows that truly require missing data and identify required fields.
### Assessment timeout/interruption
Persist attempt state where supported; otherwise safely expire and allow configured retry.
### AI generation/scoring failure
Do not persist unvalidated score. Retry where safe; otherwise mark the operation failed and preserve existing valid data.
### API timeout
Show retry-safe state; do not duplicate mutation.
### Verification failure
Keep document status pending/failed with next action.
### Duplicate application
Enforce database uniqueness and return existing application state.
### Job expired/ineligible
Prevent submission and explain reason.
### Database failure
Return generic service error, log details server-side.
### Unauthorized access
Return appropriate authorization response without leaking resource data.
### Session expiry
Redirect to login and preserve safe return path where possible.
### Upload failure
Validate type/size and allow retry.
### Rate limit
Inform user to retry later without exposing implementation details.

## 21. Logout / Session Expiry
Logout invalidates server-side session. Expired sessions cannot access protected resources. Frontend clears authenticated state and routes to login.

## 22. Request Lifecycle Pattern
```text
Trigger
↓
User action
↓
Frontend validation/state
↓
API request
↓
Authentication + authorization
↓
Backend validation
↓
Service
↓
Database / AI / external service
↓
Validated response
↓
UI state update
```

## 23. Core State Principles
- Never assume frontend state is authoritative.
- Refresh critical authorization-dependent data from backend.
- Make mutations idempotent where practical.
- Define loading, success, empty and failure states for every network-driven screen.
