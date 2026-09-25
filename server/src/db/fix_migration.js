const { getPool } = require('../config/database');

async function fix() {
  const pool = getPool();
  try {
    await pool.query("DELETE FROM schema_migrations WHERE migration_name = '010_create_session_table.sql'");
    console.log("Deleted duplicate migration.");
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
fix();
