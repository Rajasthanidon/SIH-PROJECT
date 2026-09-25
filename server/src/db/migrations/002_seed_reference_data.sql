INSERT INTO roles (name, description) VALUES
  ('student', 'Student user'),
  ('faculty', 'Faculty user'),
  ('placement', 'Placement team user'),
  ('industry', 'Industry partner'),
  ('admin', 'Administrator')
ON CONFLICT (name) DO NOTHING;

INSERT INTO skills (name, category, description) VALUES
  ('JavaScript', 'programming', 'Core frontend and backend scripting language'),
  ('TypeScript', 'programming', 'Typed JavaScript development'),
  ('React', 'frontend', 'User interface development with React'),
  ('Node.js', 'backend', 'Server-side JavaScript runtime'),
  ('Python', 'programming', 'General-purpose scripting and data work'),
  ('SQL', 'database', 'Relational database querying and design'),
  ('Communication', 'soft-skills', 'Professional communication and collaboration'),
  ('Problem Solving', 'soft-skills', 'Structured reasoning and debugging')
ON CONFLICT (name) DO NOTHING;
