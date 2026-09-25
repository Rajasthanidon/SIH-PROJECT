const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const env = require('../config/env');

const MIGRATION_DIR = path.join(__dirname, 'migrations');

function createPool() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured. Set it in the environment before running migrations.');
  }

  return new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
  });
}

async function ensureMigrationTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function runMigrations() {
  const pool = createPool();

  try {
    await ensureMigrationTable(pool);

    const files = fs
      .readdirSync(MIGRATION_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    let applied = 0;

    for (const file of files) {
      const migrationName = path.basename(file);
      const existing = await pool.query('SELECT 1 FROM schema_migrations WHERE migration_name = $1', [migrationName]);

      if (existing.rowCount > 0) {
        continue;
      }

      const migrationSql = fs.readFileSync(path.join(MIGRATION_DIR, file), 'utf8');

      console.log(`[MIGRATION] Applying ${migrationName}`);
      await pool.query('BEGIN');

      try {
        await pool.query(migrationSql);
        await pool.query('INSERT INTO schema_migrations (migration_name) VALUES ($1)', [migrationName]);
        await pool.query('COMMIT');
        applied += 1;
      } catch (error) {
        await pool.query('ROLLBACK');
        throw new Error(`Migration ${migrationName} failed: ${error.message}`);
      }
    }

    console.log(`[MIGRATION] ${applied} migration(s) applied.`);
    return { applied, total: files.length };
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('[MIGRATION] Failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  MIGRATION_DIR,
  runMigrations,
};
