-- Performance Optimization Indexes (Phase 18)

-- 1. Optimize filtering by opportunities type and status (used heavily by students and admin analytics)
CREATE INDEX IF NOT EXISTS idx_opportunities_type_status ON opportunities(type, status);

-- 2. Optimize filtering applications by status (used heavily by students, industry, and admin analytics)
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- 3. Optimize users by department (used by admin analytics and placement cell)
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- 4. Optimize students by status
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
