const { getPool } = require('../config/database');

function assertDatabaseReady() {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database connection is not configured. Set DATABASE_URL and run npm run migrate.');
  }
  return pool;
}

async function createAssessment(assessment) {
  const pool = assertDatabaseReady();

  const result = await pool.query(
    `INSERT INTO assessments (id, user_id, skill, topics, difficulty, objective, questions, result, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     RETURNING *`,
    [
      assessment.id,
      assessment.userId,
      assessment.skill,
      JSON.stringify(assessment.topics || []),
      assessment.difficulty,
      assessment.objective || '',
      JSON.stringify(assessment.questions || []),
      assessment.result ? JSON.stringify(assessment.result) : null,
      assessment.status || 'draft',
    ],
  );

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    skill: row.skill,
    topics: row.topics || [],
    difficulty: row.difficulty,
    objective: row.objective || '',
    questions: row.questions || [],
    result: row.result || null,
    status: row.status || 'draft',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getAssessmentById(id) {
  const pool = assertDatabaseReady();
  const result = await pool.query('SELECT * FROM assessments WHERE id = $1', [id]);

  if (!result.rows[0]) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    skill: row.skill,
    topics: row.topics || [],
    difficulty: row.difficulty,
    objective: row.objective || '',
    questions: row.questions || [],
    result: row.result || null,
    status: row.status || 'draft',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function updateAssessment(id, updatedAssessment) {
  const pool = assertDatabaseReady();

  const result = await pool.query(
    `UPDATE assessments SET skill = $2, topics = $3, difficulty = $4, objective = $5, questions = $6, result = $7, status = $8, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      id,
      updatedAssessment.skill,
      JSON.stringify(updatedAssessment.topics || []),
      updatedAssessment.difficulty,
      updatedAssessment.objective || '',
      JSON.stringify(updatedAssessment.questions || []),
      updatedAssessment.result ? JSON.stringify(updatedAssessment.result) : null,
      updatedAssessment.status || 'draft',
    ],
  );

  if (!result.rows[0]) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    skill: row.skill,
    topics: row.topics || [],
    difficulty: row.difficulty,
    objective: row.objective || '',
    questions: row.questions || [],
    result: row.result || null,
    status: row.status || 'draft',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getHistoryForUser(userId) {
  const pool = assertDatabaseReady();
  const safeUserId = Number(userId);

  const result = await pool.query('SELECT * FROM assessments WHERE user_id = $1 ORDER BY created_at DESC', [safeUserId]);
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    skill: row.skill,
    topics: row.topics || [],
    difficulty: row.difficulty,
    objective: row.objective || '',
    questions: row.questions || [],
    result: row.result || null,
    status: row.status || 'draft',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

module.exports = {
  createAssessment,
  getAssessmentById,
  updateAssessment,
  getHistoryForUser,
};
