# UI/UX Design Brief
## Academia–Industry Collaboration Platform — SIH26044

## 1. Design Objective
Create a professional EdTech + CareerTech portal that makes competency evidence, skill gaps and opportunity relevance immediately understandable without overwhelming users.

## 2. Design Philosophy
Evidence-first, task-oriented, accessible and role-specific. Prefer clear information hierarchy over decorative UI. Every dashboard should answer the user's immediate decision questions.

## 3. Brand Direction
**Proposed:** modern institutional + technology visual language. Avoid excessive gradients, gamification or ornamental cards. Use restrained emphasis for score states and semantic status indicators.

## 4. Color System
**Proposed semantic tokens:**
- Primary: institutional blue family.
- Success: green semantic token.
- Warning: amber semantic token.
- Error: red semantic token.
- Neutral: slate/gray scale.
- Background: light neutral with optional dark mode as **Future/Optional**.

Do not use color alone to communicate meaning.

## 5. Typography
**Proposed:** Inter or an equivalent highly legible sans-serif. Use a clear scale for page title, section title, body, labels and helper text. Maintain accessible contrast and readable line height.

## 6. Spacing
Use a consistent 4/8px-based spacing system. Prefer generous spacing around dashboard groups and compact spacing inside dense tables.

## 7. Grid
Desktop: responsive sidebar + content grid. Tablet/mobile: collapsible navigation and stacked cards. Dense analytics should become scrollable tables or stacked summaries rather than unreadable mini-columns.

## 8. Components
Buttons, inputs, selects, search, cards, tables, charts, progress bars, badges, tabs, drawers, modals, toasts, breadcrumbs, pagination, file upload, avatar/profile, empty/error/loading states.

## 9. Buttons
Primary for one dominant action; secondary for alternatives; destructive only for irreversible actions. Include disabled/loading states.

## 10. Inputs
Labels always visible; inline validation; helper text for complex fields; accessible error association. Avoid placeholder-only labels.

## 11. Cards
Use cards for bounded information groups such as skill, opportunity, readiness and application status. Avoid turning every text block into a card.

## 12. Tables
Use for recruiters, placement staff and admin workflows. Support search, filters, sorting, pagination and row-level actions. Mobile may switch to stacked records.

## 13. Charts
Use bar charts for skill comparisons, line charts for progress over time, and radar charts only where multi-dimensional comparison is genuinely useful. Always provide text alternatives/tooltips.

## 14. Badges
Use semantic labels such as Eligible, Applied, Shortlisted, Verified, Gap, Partial. Pair color with text/icon.

## 15. Modals
Use for focused confirmations or compact edits; do not put long workflows in modals.

## 16. Toasts
Short confirmation/errors; never use toasts as the sole channel for critical information.

## 17. Navigation
Role-specific sidebar with persistent active state. Global header contains profile, notifications and contextual actions.

## 18. Sidebar
### Student
Dashboard, My Skills, Assessments, Skill Gaps, Learning, Projects, Internships, Jobs, Applications, Portfolio, Profile.
### Industry
Dashboard, Jobs, Internships, Projects, Candidates, Shortlists, Applications, Analytics, Company Profile.
### Faculty
Dashboard, Students, Skills, Skill Gaps, Mentorship, Workshops, Industry, Analytics.
### Placement
Dashboard, Students, Recruiters, Drives, Applications, Placements, Skill Analytics, Reports.
### Admin
Dashboard, Users, Institutions, Skills, Topics, AI Configuration, Integrations, Audit Logs, System Settings.

## 19. Header
Contextual page title, search where relevant, notifications, help/status and user menu.

## 20. Responsive Design
Mobile-first behavior. Minimum comfortable touch targets, collapsible navigation, horizontal scrolling for dense tables, and simplified charts.

## 21. Accessibility
Keyboard navigation, visible focus, semantic HTML, labels, contrast, alt text, reduced-motion support where relevant and non-color status communication.

## 22. Student Screens
1. Landing/login/register.
2. Profile onboarding.
3. Career goal selection.
4. Skill/topic selection.
5. Assessment setup.
6. Assessment player.
7. Results.
8. Skill-gap view.
9. Learning recommendations.
10. Opportunities.
11. Opportunity detail/match explanation.
12. Application tracker.
13. Portfolio.
14. Profile/settings.

### Student Dashboard
Top: readiness + target role. Next: skill overview, top gaps, recommended actions, matched opportunities, recent assessments, project evidence and portfolio completion.

## 23. Industry Screens
Dashboard, company profile, create/edit opportunity, requirements builder, candidate search, filters, candidate scorecard, shortlist, applications and analytics.

### Candidate Scorecard
Show match, skill match, topic match, evidence, projects, internships, certifications, strengths and gaps. Each important score has an explanation.

## 24. Faculty Screens
Dashboard, student list, student profile, skill analytics, weak-topic analysis, training recommendations, mentorship, workshops/FDPs and industry trends.

## 25. Placement Screens
Student import, recruiter management, drive creation, applications, shortlist/selection pipeline, placement analytics and skill readiness.

## 26. Admin Screens
User/institution management, taxonomy, AI configuration, integrations, audit logs and system settings.

## 27. Empty States
Explain what is missing and give the next action: e.g. “No assessments yet — choose a skill to begin.”

## 28. Loading States
Use skeletons for dashboards/tables and progress indicators for assessment generation/submission. Do not leave blank screens.

## 29. Error States
State what happened, whether retry is safe and what the user can do next. Never expose internal error details.

## 30. Assessment UI
Header: skill/topic/difficulty; question number; progress; answer input; optional timer; navigation; submit. Correct answers remain hidden until assessment completion.

## 31. Skill Score Visualization
Use a large overall score only as context. Immediately show the topic breakdown beneath it. Example:
```text
Data Structures 72%
Arrays 85% | Linked Lists 78% | Trees 68% | Graphs 61% | DP 55%
```

## 32. Skill Gap Visualization
Group gaps into Matched, Partial and Missing. For each gap, show required level, current evidence and recommended action.

## 33. Candidate Scorecard
Use evidence blocks rather than a single “hire/no-hire” indicator. Present match calculation inputs and explanations.

## 34. Job Matching UI
Opportunity header → eligibility → overall match → matched skills → partial skills → missing skills → explanation → recommended actions → apply.

## 35. Analytics Dashboard
Use filters for department, batch, skill, date and role where authorized. Present KPI cards followed by trend/skill breakdown and actionable weak-topic lists.

## Visual Evidence Principle
The UI must communicate that a score comes from evidence. Prefer progress bars, topic cards, breakdowns, match indicators and readiness indicators. Avoid excessive decoration.

## Design Tokens — Proposed
```text
radius-sm: 6px
radius-md: 10px
radius-lg: 14px
spacing: 4px base
border: 1px neutral
focus-ring: 2px accessible outline
```
Exact values should be finalized in the implementation design system.
