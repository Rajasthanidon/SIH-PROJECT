const { Pool } = require('pg');
const env = require('../config/env');

async function resetDatabase() {
  if (env.NODE_ENV === 'production') {
    throw new Error('Database reset is disabled in production.');
  }

  if (process.env.ALLOW_DB_RESET !== 'true') {
    throw new Error('Set ALLOW_DB_RESET=true to reset the development database explicitly.');
  }

  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('[DB RESET] Dropping public schema.');
    await pool.query('DROP SCHEMA public CASCADE;');
    await pool.query('CREATE SCHEMA public;');
    console.log('[DB RESET] Public schema recreated. Run npm run migrate to restore the schema.');
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[DB RESET] Failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  resetDatabase,
};
