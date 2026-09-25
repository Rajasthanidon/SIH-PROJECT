require('dotenv').config({ path: '../server/.env' });
const { Pool } = require('pg');

async function testQueries() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log('Testing direct DB queries...');
  
  // Connect once
  const client = await pool.connect();
  console.log('Connected to DB');

  const userId = 50;

  // Measure SELECT 1
  const t0 = performance.now();
  await client.query('SELECT 1');
  console.log(`SELECT 1 took: ${(performance.now() - t0).toFixed(2)}ms`);

  // Measure requireAuth query
  const t1 = performance.now();
  await client.query('SELECT status, is_active FROM users WHERE id = $1', [userId]);
  console.log(`requireAuth query took: ${(performance.now() - t1).toFixed(2)}ms`);

  // Measure getStudentProfile query
  const t2 = performance.now();
  await client.query(`
    SELECT sp.*, u.name, u.email, u.phone, u.profile_photo
    FROM student_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.user_id = $1
  `, [userId]);
  console.log(`getStudentProfile query took: ${(performance.now() - t2).toFixed(2)}ms`);

  // Measure projects query
  const t3 = performance.now();
  await client.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  console.log(`projects query took: ${(performance.now() - t3).toFixed(2)}ms`);

  // Measure internships query
  const t4 = performance.now();
  await client.query('SELECT * FROM internships WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  console.log(`internships query took: ${(performance.now() - t4).toFixed(2)}ms`);

  // Measure assessment_attempts query
  const t5 = performance.now();
  await client.query('SELECT * FROM assessment_attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
  console.log(`assessment_attempts query took: ${(performance.now() - t5).toFixed(2)}ms`);

  // Measure assessment_results query
  const t6 = performance.now();
  await client.query('SELECT * FROM assessment_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
  console.log(`assessment_results query took: ${(performance.now() - t6).toFixed(2)}ms`);

  // Measure findActive opportunities query
  const t7 = performance.now();
  await client.query(`
    SELECT * FROM opportunities 
    WHERE status IN ('PUBLISHED', 'ACTIVE') 
    AND (application_deadline IS NULL OR application_deadline > NOW()) 
    ORDER BY created_at DESC
  `);
  console.log(`findActive opportunities query took: ${(performance.now() - t7).toFixed(2)}ms`);

  // Test parallel execution with Promise.all
  const tPar = performance.now();
  await Promise.all([
    client.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    client.query('SELECT * FROM internships WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    client.query('SELECT * FROM assessment_attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]),
    client.query('SELECT * FROM assessment_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]),
  ]).catch(async () => {
    // Note: a single client cannot execute queries in parallel, need pool.query!
  });

  const tPoolPar = performance.now();
  await Promise.all([
    pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    pool.query('SELECT * FROM internships WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    pool.query('SELECT * FROM assessment_attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]),
    pool.query('SELECT * FROM assessment_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]),
  ]);
  console.log(`Pool Promise.all 4 dashboard queries took: ${(performance.now() - tPoolPar).toFixed(2)}ms`);

  client.release();
  await pool.end();
}

testQueries().catch(console.error);
