const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.uqrvjqvzltmvtcnndcbm:8wzB5Ezafcmv1g8F@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function main() {
  const result = await pool.query('SELECT sid, sess, expire FROM "session"');
  console.log('Session records:', JSON.stringify(result.rows, null, 2));
  
  const pgTime = await pool.query('SELECT NOW() as now, current_setting(\'TIMEZONE\') as tz');
  console.log('PG Time:', JSON.stringify(pgTime.rows[0], null, 2));
  
  pool.end();
}

main().catch(console.error);
