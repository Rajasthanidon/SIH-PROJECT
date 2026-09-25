const { Pool } = require('pg');
const env = require('./env');

let pool = null;

function createPool() {
  if (!env.DATABASE_URL) {
    console.warn('[DATABASE] DATABASE_URL is not configured. Database connectivity checks will be skipped until env is set.');
    return null;
  }

  return new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
  });
}

async function testDatabaseConnection() {
  if (!env.DATABASE_URL) {
    return {
      connected: false,
      status: 'not_configured',
      message: 'DATABASE_URL is not configured.',
    };
  }

  if (!pool) {
    pool = createPool();
  }

  try {
    const result = await pool.query('SELECT 1');
    return {
      connected: true,
      status: 'connected',
      message: `Database connection succeeded: ${result.rowCount}`,
    };
  } catch (error) {
    console.error('[DATABASE] Connection failed:', error.message);
    return {
      connected: false,
      status: 'unavailable',
      message: error.message,
    };
  }
}

module.exports = {
  createPool,
  testDatabaseConnection,
  getPool: () => {
    if (!pool) {
      pool = createPool();
    }
    return pool;
  },
};
