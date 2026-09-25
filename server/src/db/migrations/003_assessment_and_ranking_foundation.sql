CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS target_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  default_difficulty VARCHAR(50) NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS target_role_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_role_id UUID NOT NULL REFERENCES target_roles(id) ON DELETE CASCADE,
  skill_name VARCHAR(120) NOT NULL,
  required_level INTEGER NOT NULL DEFAULT 60,
  weight NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  is_core BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (target_role_id, skill_name)
);

CREATE TABLE IF NOT EXISTS question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(120) NOT NULL,
  skill_name VARCHAR(120) NOT NULL,
  topic VARCHAR(120) NOT NULL,
  difficulty VARCHAR(50) NOT NULL DEFAULT 'medium',
  question_type VARCHAR(50) NOT NULL DEFAULT 'mcq',
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  explanation TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL,
  target_role VARCHAR(120) NOT NULL,
  skill_name VARCHAR(120),
  difficulty VARCHAR(50) NOT NULL DEFAULT 'medium',
  total_questions INTEGER NOT NULL DEFAULT 0,
  attempted_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  incorrect_answers INTEGER NOT NULL DEFAULT 0,
  unanswered INTEGER NOT NULL DEFAULT 0,
  technical_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
  score_version VARCHAR(50) NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  selected_option TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  target_role VARCHAR(120) NOT NULL,
  technical_test_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  project_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  internship_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  skill_scores JSONB NOT NULL DEFAULT '[]',
  strengths JSONB NOT NULL DEFAULT '[]',
  weaknesses JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS score_config (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  version VARCHAR(50) NOT NULL,
  weights JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_score_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_role VARCHAR(120) NOT NULL,
  technical_test_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  project_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  internship_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  current_rank INTEGER NOT NULL DEFAULT 0,
  score_version VARCHAR(50) NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_role, score_version)
);

CREATE INDEX IF NOT EXISTS idx_target_role_requirements_target_role_id ON target_role_requirements(target_role_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_role_name ON question_bank(role_name);
CREATE INDEX IF NOT EXISTS idx_question_bank_skill_name ON question_bank(skill_name);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON question_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_attempt_id ON assessment_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_student_score_snapshots_overall_score ON student_score_snapshots(overall_score DESC);

INSERT INTO target_roles (name, description, default_difficulty) VALUES
  ('Full Stack Developer', 'Full stack engineering role focused on frontend, backend, APIs, and data access.', 'medium'),
  ('Frontend Engineer', 'User interface and frontend product engineering role.', 'medium'),
  ('Backend Engineer', 'API, server-side logic, integrations, and data layer engineering.', 'medium'),
  ('Data Analyst', 'Business intelligence, data interpretation, and reporting work.', 'easy')
ON CONFLICT (name) DO NOTHING;

INSERT INTO target_role_requirements (target_role_id, skill_name, required_level, weight, is_core)
SELECT tr.id, skill.skill_name, skill.required_level, skill.weight, skill.is_core
FROM target_roles tr
JOIN (
  VALUES
    ('Full Stack Developer', 'JavaScript', 70, 1.0, TRUE),
    ('Full Stack Developer', 'React', 68, 1.0, TRUE),
    ('Full Stack Developer', 'Node.js', 72, 1.0, TRUE),
    ('Full Stack Developer', 'SQL', 70, 1.0, TRUE),
    ('Full Stack Developer', 'REST APIs', 75, 1.0, TRUE),
    ('Full Stack Developer', 'Git', 65, 0.8, FALSE),
    ('Full Stack Developer', 'Problem Solving', 78, 1.2, TRUE),
    ('Frontend Engineer', 'JavaScript', 80, 1.0, TRUE),
    ('Frontend Engineer', 'React', 82, 1.2, TRUE),
    ('Frontend Engineer', 'SQL', 60, 0.8, FALSE),
    ('Frontend Engineer', 'Git', 65, 0.8, FALSE),
    ('Frontend Engineer', 'Problem Solving', 72, 1.1, TRUE),
    ('Backend Engineer', 'Node.js', 82, 1.2, TRUE),
    ('Backend Engineer', 'SQL', 78, 1.1, TRUE),
    ('Backend Engineer', 'REST APIs', 80, 1.2, TRUE),
    ('Backend Engineer', 'Git', 70, 0.9, TRUE),
    ('Backend Engineer', 'Problem Solving', 74, 1.1, TRUE),
    ('Data Analyst', 'SQL', 80, 1.3, TRUE),
    ('Data Analyst', 'Python', 75, 1.0, TRUE),
    ('Data Analyst', 'Problem Solving', 70, 1.0, TRUE),
    ('Data Analyst', 'Communication', 65, 0.7, FALSE)
) AS skill(target_role_name, skill_name, required_level, weight, is_core)
ON skill.target_role_name = tr.name
ON CONFLICT (target_role_id, skill_name) DO NOTHING;

INSERT INTO question_bank (
  role_name,
  skill_name,
  topic,
  difficulty,
  question_type,
  question,
  options,
  correct_answer,
  points,
  explanation,
  is_active
) VALUES
  ('Full Stack Developer', 'JavaScript', 'Closures', 'easy', 'mcq', 'What does a closure capture?', '["Only the current value of a variable","The function call context","The lexical environment where it was created","The browser DOM"]', 'The lexical environment where it was created', 2, 'A closure keeps access to the lexical environment in which it was created, even after the outer function returns.', TRUE),
  ('Full Stack Developer', 'JavaScript', 'Async Patterns', 'medium', 'mcq', 'Which JavaScript feature is typically used to avoid blocking the main thread during I/O-bound work?', '["for...of loops","setTimeout","async/await","alert()"]', 'async/await', 2, 'async/await is the standard pattern for writing asynchronous code in a readable, non-blocking way.', TRUE),
  ('Full Stack Developer', 'React', 'Hooks', 'medium', 'mcq', 'Why are hooks used in React components?', '["To mutate the DOM directly","To reuse lifecycle and state logic across components","To replace CSS classes","To create server-side routes"]', 'To reuse lifecycle and state logic across components', 2, 'Hooks allow stateful logic to be reused and composed in functional components.', TRUE),
  ('Full Stack Developer', 'Node.js', 'Express', 'medium', 'mcq', 'What is the main purpose of Express middleware?', '["To define a database schema","To intercept and process incoming requests/responses","To encrypt passwords automatically","To style JSX components"]', 'To intercept and process incoming requests/responses', 2, 'Middleware runs between the request and response lifecycle and can modify, validate, or forward traffic.', TRUE),
  ('Full Stack Developer', 'SQL', 'Joins', 'easy', 'mcq', 'Which SQL join returns rows present in both tables?', '["LEFT JOIN","RIGHT JOIN","INNER JOIN","FULL OUTER JOIN"]', 'INNER JOIN', 2, 'INNER JOIN returns only matching rows from both tables.', TRUE),
  ('Full Stack Developer', 'REST APIs', 'HTTP', 'medium', 'mcq', 'Which HTTP method is most appropriate for creating a new resource?', '["GET","POST","DELETE","PATCH"]', 'POST', 2, 'POST is the conventional method for creating a new resource on the server.', TRUE),
  ('Full Stack Developer', 'Git', 'Version Control', 'easy', 'mcq', 'What does a git pull do?', '["Deletes local branches","Fetches and merges remote changes into the current branch","Creates a new commit","Runs tests automatically"]', 'Fetches and merges remote changes into the current branch', 1, 'git pull updates the current branch with the latest remote branch state.', TRUE),
  ('Full Stack Developer', 'Problem Solving', 'Algorithm Design', 'medium', 'mcq', 'Which approach is most suitable for finding the shortest path in a weighted graph?', '["Depth-first search only","Breadth-first search only","Dijkstra''s algorithm","Bubble sort"]', 'Dijkstra''s algorithm', 2, 'Dijkstra''s algorithm is designed for shortest-path problems in non-negative weighted graphs.', TRUE),
  ('Frontend Engineer', 'JavaScript', 'Events', 'easy', 'mcq', 'What is the purpose of event delegation?', '["To increase CSS specificity","To handle events from child elements through a parent container","To block browser events","To replace the DOM"]', 'To handle events from child elements through a parent container', 2, 'Event delegation lets one parent listener handle events from multiple child elements efficiently.', TRUE),
  ('Frontend Engineer', 'React', 'State', 'medium', 'mcq', 'What should be used to update component state in React?', '["Direct DOM mutation","setState or the state setter returned by useState","window.location assignment","The browser cache"]', 'setState or the state setter returned by useState', 2, 'React state updates should go through the state setter so the UI re-renders correctly.', TRUE),
  ('Backend Engineer', 'Node.js', 'API Design', 'medium', 'mcq', 'Which pattern helps keep server routes organized and maintainable?', '["Inline DOM script tags","Modular route handlers and middleware","CSS media queries","Hardcoded configuration in HTML"]', 'Modular route handlers and middleware', 2, 'Modular route handlers and middleware keep server logic understandable and extensible.', TRUE),
  ('Backend Engineer', 'SQL', 'Normalization', 'medium', 'mcq', 'What is a common benefit of database normalization?', '["It removes all indexes","It reduces data redundancy and improves consistency","It replaces SQL with NoSQL","It guarantees faster queries for all workloads"]', 'It reduces data redundancy and improves consistency', 2, 'Normalization minimizes duplication and helps maintain consistent data storage.', TRUE),
  ('Backend Engineer', 'REST APIs', 'HTTP', 'easy', 'mcq', 'Which status code indicates a successful resource creation?', '["200 OK","201 Created","404 Not Found","500 Internal Server Error"]', '201 Created', 2, '201 Created is the standard status code for a successfully created resource.', TRUE),
  ('Data Analyst', 'SQL', 'Aggregations', 'easy', 'mcq', 'Which SQL clause is used to group rows by a column before aggregation?', '["WHERE","GROUP BY","HAVING","ORDER BY"]', 'GROUP BY', 2, 'GROUP BY groups rows so aggregate functions can compute per-group results.', TRUE),
  ('Data Analyst', 'Python', 'Data Cleaning', 'medium', 'mcq', 'Which Python library is commonly used for tabular data analysis?', '["Pillow","pandas","Flask","BeautifulSoup"]', 'pandas', 2, 'pandas provides robust tabular data structures and analysis functionality for data cleaning and transformation.', TRUE),
  ('Data Analyst', 'Problem Solving', 'Interpretation', 'easy', 'mcq', 'What is the best first step when a KPI unexpectedly drops?', '["Ignore it and wait for the next quarter","Check the data pipeline, recent changes, and segment-level breakdowns","Delete all historical records","Rebuild the entire business model"]', 'Check the data pipeline, recent changes, and segment-level breakdowns', 2, 'A systematic diagnostic approach helps identify whether the drop is due to a real trend or a data issue.', TRUE);

INSERT INTO score_config (name, version, weights, is_active)
VALUES
  ('default_assessment_weights', 'v1', '{"technicalTest": 0.5, "project": 0.3, "internship": 0.2}', TRUE)
ON CONFLICT (name) DO NOTHING;
