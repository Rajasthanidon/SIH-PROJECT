-- Create departments master data table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: We intentionally do NOT alter the users table to use department_id as a foreign key.
-- This preserves historical records and avoids a massive destructive migration.
-- The users.department field will continue to store the string value, but the frontend
-- will now use this table to populate a standardized dropdown.

INSERT INTO departments (name)
SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department != ''
ON CONFLICT (name) DO NOTHING;
