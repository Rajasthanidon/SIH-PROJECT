-- Performance & Optimization Indexes (Phase 20)

-- 1. Optimize active opportunities listing with composite filter and sort
CREATE INDEX IF NOT EXISTS idx_opportunities_active_sort ON opportunities(status, application_deadline, created_at DESC);

-- 2. Optimize applications lookup by student and opportunity (used by student status checks and ownership verification)
CREATE INDEX IF NOT EXISTS idx_applications_student_opp ON applications(student_id, opportunity_id);

-- 3. Optimize student dashboard & skills assessment queries
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_created ON assessment_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_created ON assessment_results(user_id, created_at DESC);

-- 4. Optimize student projects & internships dashboard queries
CREATE INDEX IF NOT EXISTS idx_projects_user_created ON projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internships_user_created ON internships(user_id, created_at DESC);
