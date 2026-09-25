-- 007_placement_opportunities.sql
-- Create opportunities table (jobs & internships)
CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  industry_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('JOB', 'INTERNSHIP')),
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  responsibilities TEXT,
  required_skills JSONB NOT NULL DEFAULT '[]',
  preferred_qualifications TEXT,
  
  -- Internship specific
  internship_duration VARCHAR(100),
  stipend VARCHAR(100),
  ppo_available BOOLEAN DEFAULT FALSE,
  
  -- Job specific
  salary VARCHAR(100),
  employment_type VARCHAR(100),
  
  -- Common
  location VARCHAR(255) NOT NULL,
  work_mode VARCHAR(50) NOT NULL CHECK (work_mode IN ('On-site', 'Hybrid', 'Remote')),
  application_deadline TIMESTAMPTZ,
  openings INTEGER,
  
  -- Eligibility
  min_cgpa NUMERIC(4,2),
  allowed_branches JSONB NOT NULL DEFAULT '[]',
  batch_eligibility JSONB NOT NULL DEFAULT '[]',
  experience_requirement VARCHAR(255),
  additional_requirements TEXT,
  
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'EXPIRED')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_industry_id ON opportunities(industry_id);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN')),
  
  -- Snapshot of student profile at the time of application
  profile_snapshot JSONB NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate applications
  CONSTRAINT uq_opportunity_student UNIQUE (opportunity_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g., 'NEW_OPPORTUNITY', 'APPLICATION_UPDATE'
  reference_id INTEGER, -- e.g., opportunity_id or application_id
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
