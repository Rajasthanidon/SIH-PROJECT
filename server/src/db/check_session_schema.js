const { getPool } = require('../config/database');

async function check() {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'session';
    `);
    console.log(JSON.stringify(result.rows, null, 2));

    const migrationResult = await pool.query(`SELECT * FROM schema_migrations ORDER BY executed_at DESC;`);
    console.log("MIGRATIONS:");
    console.log(JSON.stringify(migrationResult.rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
check();
