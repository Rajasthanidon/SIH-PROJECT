const { Pool } = require('pg');
const env = require('../config/env');

function createPool() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  return new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
  });
}

async function seedDatabase() {
  const pool = createPool();

  try {
    await pool.query(`
      INSERT INTO roles (name, description) VALUES
        ('student', 'Student user'),
        ('faculty', 'Faculty user'),
        ('placement', 'Placement team user'),
        ('industry', 'Industry partner'),
        ('admin', 'Administrator')
      ON CONFLICT (name) DO NOTHING;
    `);

    await pool.query(`
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
    `);

    console.log('[SEED] Reference data loaded.');
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[SEED] Failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
};
