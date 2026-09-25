const { getPool } = require('../config/database');

function assertDatabaseReady() {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database connection is not configured. Set DATABASE_URL and run npm run migrate.');
  }
  return pool;
}

async function saveSkillGapAnalysis(userId, analysis) {
  const payload = {
    userId: Number(userId),
    analysis,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const pool = assertDatabaseReady();
  await pool.query(
    `INSERT INTO student_skill_gap_analysis (user_id, analysis, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       analysis = EXCLUDED.analysis,
       updated_at = NOW()`,
    [Number(userId), JSON.stringify(analysis)],
  );

  return payload;
}

async function getSkillGapAnalysis(userId) {
  const pool = assertDatabaseReady();
  const safeUserId = Number(userId);

  const result = await pool.query('SELECT * FROM student_skill_gap_analysis WHERE user_id = $1', [safeUserId]);
  return result.rows[0]?.analysis || null;
}

module.exports = {
  saveSkillGapAnalysis,
  getSkillGapAnalysis,
};
