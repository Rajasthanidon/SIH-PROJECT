const crypto = require('node:crypto');
const { getPool } = require('../config/database');
const AppError = require('../utils/AppError');
const { normalizeDifficulty, validateAnswerPayload } = require('../utils/assessmentSchemas');
const { generateQuestionSet } = require('./aiService');
const { evaluateAssessment } = require('./scoringService');
const assessmentRepository = require('../repositories/assessment.repository');

function buildAssessmentId() {
  return crypto.randomUUID ? crypto.randomUUID() : `assessment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeAssessmentInput(payload = {}) {
  const skill = String(payload.skill || '').trim();
  const topics = Array.isArray(payload.topics) ? payload.topics.filter(Boolean).map(String) : [];
  const difficulty = normalizeDifficulty(payload.difficulty);
  const objective = String(payload.objective || '').trim();

  if (!skill) {
    throw new AppError('Assessment skill is required.', 400);
  }

  return {
    skill,
    topics,
    difficulty,
    objective,
  };
}

function normalizeRoleName(value) {
  const role = String(value || '').trim();
  if (!role) {
    throw new AppError('Target role is required.', 400);
  }

  return role;
}

function normalizeSkillName(value, fieldName = 'Skill') {
  const skill = String(value || '').trim();
  if (!skill) {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  return skill;
}

function sanitizeQuestionForClient(question = {}) {
  if (!question || typeof question !== 'object') {
    return question;
  }

  const nextQuestion = { ...question };
  delete nextQuestion.correctAnswer;
  delete nextQuestion.correct_answer;
  delete nextQuestion.answerKey;
  delete nextQuestion.points;
  delete nextQuestion.explanation;

  if (Array.isArray(nextQuestion.options)) {
    nextQuestion.options = nextQuestion.options.map((option) => String(option));
  }

  if (nextQuestion.type === 'mcq' && Array.isArray(nextQuestion.options)) {
    nextQuestion.options = nextQuestion.options.filter((option) => option !== undefined && option !== null);
  }

  return nextQuestion;
}

function buildQuestionBankQuestion(row) {
  return {
    id: String(row.id),
    role: row.role_name,
    skill: row.skill_name,
    topic: row.topic,
    type: row.question_type || 'mcq',
    prompt: row.question,
    difficulty: normalizeDifficulty(row.difficulty),
    options: Array.isArray(row.options) ? row.options.map((option) => String(option)) : [],
    correctAnswer: row.correct_answer || row.correctAnswer || '',
    points: Number(row.points || 1),
    explanation: row.explanation || '',
    metadata: {
      objective: `Assess ${row.role_name} readiness.`,
      role: row.role_name,
    },
  };
}

async function listTargetRoles() {
  const pool = getPool();
  if (!pool) {
    throw new AppError('Database configuration is missing.', 500);
  }

  const result = await pool.query('SELECT * FROM target_roles WHERE is_active = TRUE ORDER BY name ASC');

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    defaultDifficulty: row.default_difficulty || 'medium',
  }));
}

async function getTargetRoleDefinition(roleName) {
  const normalizedRole = normalizeRoleName(roleName);
  const pool = getPool();
  if (!pool) {
    throw new AppError('Database configuration is missing.', 500);
  }

  const roleResult = await pool.query('SELECT * FROM target_roles WHERE LOWER(name) = LOWER($1) AND is_active = TRUE', [normalizedRole]);
  if (!roleResult.rows[0]) {
    throw new AppError(`Target role '${normalizedRole}' was not found.`, 404);
  }

  const skillResult = await pool.query(
    `SELECT skill_name AS name, required_level AS requiredLevel, weight, is_core AS isCore
     FROM target_role_requirements
     WHERE target_role_id = $1
     ORDER BY is_core DESC, skill_name ASC`,
    [roleResult.rows[0].id],
  );

  return {
    id: roleResult.rows[0].id,
    name: roleResult.rows[0].name,
    description: roleResult.rows[0].description || '',
    defaultDifficulty: roleResult.rows[0].default_difficulty || 'medium',
    skills: skillResult.rows.map((skill) => ({
      name: skill.name,
      requiredLevel: Number(skill.requiredlevel ?? skill.requiredLevel ?? 0),
      weight: Number(skill.weight ?? 1),
      isCore: Boolean(skill.iscore ?? skill.isCore ?? true),
    })),
  };
}

async function fetchQuestionBank(roleName, difficulty, count = 5, skillName = null) {
  const pool = getPool();
  if (!pool) {
    throw new AppError('Database configuration is missing.', 500);
  }

  const questionCount = Math.max(1, Number(count) || 5);
  const normalizedRole = roleName ? normalizeRoleName(roleName) : null;
  const normalizedSkill = skillName ? normalizeSkillName(skillName, 'Skill') : null;
  const difficultyValue = normalizeDifficulty(difficulty);

  const params = [];
  let query = `SELECT *
     FROM question_bank
     WHERE is_active = TRUE
       AND (difficulty = $${params.length + 1} OR difficulty = 'easy' OR difficulty = 'medium' OR difficulty = 'hard')`;
  params.push(difficultyValue);

  if (normalizedRole) {
    query += ` AND role_name = $${params.length + 1}`;
    params.push(normalizedRole);
  }

  if (normalizedSkill) {
    query += ` AND LOWER(skill_name) = LOWER($${params.length + 1})`;
    params.push(normalizedSkill);
  }

  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
  params.push(questionCount);

  const result = await pool.query(query, params);
  return result.rows.map(buildQuestionBankQuestion);
}

async function searchSkills(searchTerm = '') {
  const pool = getPool();
  if (!pool) {
    throw new AppError('Database configuration is missing.', 500);
  }

  const term = String(searchTerm || '').trim();
  const query = term
    ? 'SELECT * FROM skills WHERE LOWER(name) LIKE LOWER($1) ORDER BY name ASC LIMIT 50'
    : 'SELECT * FROM skills ORDER BY name ASC LIMIT 50';
  const params = term ? [`%${term}%`] : [];

  const result = await pool.query(query, params);
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category || 'general',
    description: row.description || '',
  }));
}

async function createSkillRecord(skillName, metadata = {}) {
  const name = normalizeSkillName(skillName, 'Skill');
  const pool = getPool();
  if (!pool) {
    throw new AppError('Database configuration is missing.', 500);
  }

  const description = String(metadata.description || '').trim();
  const category = String(metadata.category || 'general').trim() || 'general';

  const result = await pool.query(
    `INSERT INTO skills (name, category, description)
     VALUES ($1, $2, $3)
     ON CONFLICT (name) DO UPDATE SET
       category = EXCLUDED.category,
       description = EXCLUDED.description,
       updated_at = NOW()
     RETURNING *`,
    [name, category, description],
  );

  return {
    id: result.rows[0].id,
    name: result.rows[0].name,
    category: result.rows[0].category || 'general',
    description: result.rows[0].description || '',
  };
}

async function getSkillTopics(skillName) {
  const skill = normalizeSkillName(skillName, 'Skill');
  const pool = getPool();
  if (!pool) {
    throw new AppError('Database configuration is missing.', 500);
  }

  const skillRow = await pool.query('SELECT * FROM skills WHERE LOWER(name) = LOWER($1)', [skill]);
  const topicsResult = await pool.query(
    `SELECT DISTINCT topic
     FROM question_bank
     WHERE LOWER(skill_name) = LOWER($1) AND is_active = TRUE
     ORDER BY topic ASC`,
    [skill],
  );

  return {
    skill,
    description: skillRow.rows[0]?.description || '',
    category: skillRow.rows[0]?.category || 'general',
    topics: topicsResult.rows.map((row) => row.topic).filter(Boolean),
  };
}

async function generateAssessment(userId, payload = {}) {
  const config = normalizeAssessmentInput(payload);
  const generated = await generateQuestionSet(config);

  const assessment = {
    id: buildAssessmentId(),
    userId: Number(userId),
    skill: generated.skill,
    topics: config.topics.length ? config.topics : generated.questions.map((question) => question.topic),
    difficulty: generated.difficulty,
    objective: config.objective || generated.objective || 'Assess overall readiness.',
    questions: generated.questions,
    result: null,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await assessmentRepository.createAssessment(assessment);

  return {
    id: assessment.id,
    userId: assessment.userId,
    skill: assessment.skill,
    topics: assessment.topics,
    difficulty: assessment.difficulty,
    objective: assessment.objective,
    questions: assessment.questions.map(sanitizeQuestionForClient),
    status: assessment.status,
    createdAt: assessment.createdAt,
  };
}

async function startSkillAssessment(userId, payload = {}) {
  const skillName = normalizeSkillName(payload.skill || payload.skillName || payload.selectedSkill, 'Skill');
  const category = String(payload.category || 'general').trim() || 'general';
  const difficulty = normalizeDifficulty(payload.difficulty || 'medium');
  const requestedTopics = Array.isArray(payload.topics) ? payload.topics.filter(Boolean).map(String) : [];
  const fallbackQuestionCount = requestedTopics.length ? requestedTopics.length * 5 : 10;
  const requestedQuestionCount = Number(payload.questionCount);
  const questionCount = Math.max(1, Number.isFinite(requestedQuestionCount) && requestedQuestionCount > 0 ? requestedQuestionCount : fallbackQuestionCount);

  await createSkillRecord(skillName, { category, description: payload.description || `Skill assessment for ${skillName}.` });

  const knownSkillTopics = await getSkillTopics(skillName);
  const topicList = requestedTopics.length ? requestedTopics : knownSkillTopics.topics.length ? knownSkillTopics.topics : ['Core Concepts'];

  let questions = await fetchQuestionBank(null, difficulty, questionCount, skillName);
  if (requestedTopics.length) {
    questions = questions.filter((question) => topicList.includes(question.topic));
  }

  if (!questions.length) {
    if (!process.env.AI_API_URL || !process.env.AI_API_KEY) {
      throw new AppError(`No question bank exists for "${skillName}". Add the skill and topic questions manually or configure the AI provider.`, 404);
    }

    const generated = await generateQuestionSet({
      skill: skillName,
      topics: topicList,
      difficulty,
      objective: `${skillName} assessment`,
    });

    questions = generated.questions.map((question, index) => ({
      id: `${skillName}-${index + 1}`,
      role: 'general',
      skill: question.skill || skillName,
      topic: question.topic || topicList[index % topicList.length] || 'Core Concepts',
      type: question.type || 'mcq',
      prompt: question.prompt,
      difficulty: normalizeDifficulty(question.difficulty || difficulty),
      options: Array.isArray(question.options) ? question.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: String(question.correctAnswer || question.answer || question.correct_answer || 'Option A'),
      points: Number(question.points || 1),
      explanation: question.explanation || '',
      metadata: question.metadata || {},
    }));
  }

  const assessmentId = buildAssessmentId();
  const assessment = {
    id: assessmentId,
    userId: Number(userId),
    skill: skillName,
    topics: topicList,
    difficulty,
    objective: `${skillName} assessment`,
    questions: questions.map((question) => ({
      ...question,
      id: String(question.id),
      questionId: String(question.id),
      prompt: question.prompt,
      topic: question.topic,
      skill: question.skill,
      type: question.type || 'mcq',
      difficulty: normalizeDifficulty(question.difficulty || difficulty),
      options: Array.isArray(question.options) ? question.options : [],
      correctAnswer: String(question.correctAnswer || question.answerKey || question.correct_answer || ''),
      points: Number(question.points || 1),
      explanation: question.explanation || '',
      metadata: question.metadata || {},
    })),
    result: null,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await assessmentRepository.createAssessment(assessment);

  const pool = getPool();
  const attemptId = crypto.randomUUID ? crypto.randomUUID() : `attempt-${Date.now()}`;
  await pool.query(
    `INSERT INTO assessment_attempts (id, user_id, assessment_id, target_role, skill_name, difficulty, total_questions, attempted_questions, correct_answers, incorrect_answers, unanswered, technical_score, status, score_version, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, 0, 0, 'in_progress', 'v1', NOW())`,
    [attemptId, Number(userId), assessmentId, skillName, skillName, difficulty, assessment.questions.length],
  );

  return {
    id: assessment.id,
    userId: assessment.userId,
    skill: assessment.skill,
    topics: assessment.topics,
    difficulty: assessment.difficulty,
    objective: assessment.objective,
    questions: assessment.questions.map(sanitizeQuestionForClient),
    status: assessment.status,
    createdAt: assessment.createdAt,
    attemptId,
  };
}

async function startAssessment(userId, payload = {}) {
  if (payload.skill || payload.skillName || payload.selectedSkill) {
    return startSkillAssessment(userId, payload);
  }

  const roleName = normalizeRoleName(payload.targetRole || payload.role);
  const targetRole = await getTargetRoleDefinition(roleName);
  const difficulty = normalizeDifficulty(payload.difficulty || targetRole.defaultDifficulty);
  const questionCount = Math.max(1, Number(payload.questionCount || 5));

  const questions = await fetchQuestionBank(roleName, difficulty, questionCount);
  if (!questions.length) {
    throw new AppError(`No questions are available for ${roleName}.`, 404);
  }

  const assessmentId = buildAssessmentId();
  const assessment = {
    id: assessmentId,
    userId: Number(userId),
    skill: roleName,
    topics: targetRole.skills.map((skill) => skill.name),
    difficulty,
    objective: `${roleName} technical readiness assessment`,
    questions: questions.map((question) => ({
      ...question,
      id: String(question.id),
      questionId: String(question.id),
      prompt: question.prompt,
      topic: question.topic,
      skill: question.skill,
      type: question.type || 'mcq',
      difficulty: question.difficulty,
      options: Array.isArray(question.options) ? question.options : [],
      correctAnswer: question.correctAnswer || '',
      points: Number(question.points || 1),
      explanation: question.explanation || '',
      metadata: question.metadata || {},
    })),
    result: null,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await assessmentRepository.createAssessment(assessment);

  const pool = getPool();
  const attemptId = crypto.randomUUID ? crypto.randomUUID() : `attempt-${Date.now()}`;
  await pool.query(
    `INSERT INTO assessment_attempts (id, user_id, assessment_id, target_role, skill_name, difficulty, total_questions, attempted_questions, correct_answers, incorrect_answers, unanswered, technical_score, status, score_version, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, 0, 0, 'in_progress', 'v1', NOW())`,
    [attemptId, Number(userId), assessmentId, roleName, roleName, difficulty, assessment.questions.length],
  );

  return {
    id: assessment.id,
    userId: assessment.userId,
    skill: assessment.skill,
    topics: assessment.topics,
    difficulty: assessment.difficulty,
    objective: assessment.objective,
    questions: assessment.questions.map(sanitizeQuestionForClient),
    status: assessment.status,
    createdAt: assessment.createdAt,
    attemptId,
  };
}

async function submitAssessment(userId, assessmentId, payload = {}) {
  const assessment = await assessmentRepository.getAssessmentById(assessmentId);

  if (!assessment) {
    throw new AppError('Assessment not found.', 404);
  }

  if (Number(assessment.userId) !== Number(userId)) {
    throw new AppError('You are not authorized to submit this assessment.', 403);
  }

  const answers = validateAnswerPayload(Array.isArray(payload.answers) ? payload.answers : []);
  const questionMap = new Map((assessment.questions || []).map((question) => [String(question.id), question]));
  const answerMap = new Map(answers.map((answer) => [String(answer.questionId), answer.answer]));

  let totalScore = 0;
  let totalPossible = 0;
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  const skillTotals = new Map();
  const skillScores = [];

  for (const question of assessment.questions || []) {
    const questionId = String(question.id);
    const selectedAnswer = answerMap.get(questionId);
    const correctAnswer = String(question.correctAnswer || question.answerKey || '').trim();
    const points = Number(question.points || 1);
    totalPossible += points;

    if (!selectedAnswer) {
      unanswered += 1;
      continue;
    }

    if (selectedAnswer === correctAnswer) {
      totalScore += points;
      correct += 1;
    } else {
      incorrect += 1;
    }

    const savedSkill = String(question.skill || assessment.skill || 'General');
    const current = skillTotals.get(savedSkill) || { pointsEarned: 0, totalPoints: 0, count: 0 };
    current.pointsEarned += selectedAnswer === correctAnswer ? points : 0;
    current.totalPoints += points;
    current.count += 1;
    skillTotals.set(savedSkill, current);
  }

  for (const [skillName, skillRecord] of skillTotals.entries()) {
    const normalized = skillRecord.totalPoints > 0 ? Math.round((skillRecord.pointsEarned / skillRecord.totalPoints) * 100) : 0;
    skillScores.push({
      name: skillName,
      score: normalized,
      totalQuestions: skillRecord.count,
      percentage: normalized,
    });
  }

  const technicalTestScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
  const strengths = skillScores.filter((skill) => skill.score >= 70).map((skill) => skill.name);
  const weaknesses = skillScores.filter((skill) => skill.score < 60).map((skill) => skill.name);

  const result = {
    assessmentId,
    technicalTestScore,
    totalQuestions: assessment.questions?.length || 0,
    attempted: answers.length,
    correct,
    incorrect,
    unanswered,
    percentage: technicalTestScore,
    skillScores,
    strengths: strengths.length ? strengths : ['Keep practicing core concepts'],
    weaknesses: weaknesses.length ? weaknesses : ['No major gaps identified'],
    scoreVersion: 'v1',
    generatedAt: new Date().toISOString(),
  };

  const updatedAssessment = {
    ...assessment,
    result,
    status: 'completed',
    updatedAt: new Date().toISOString(),
  };

  await assessmentRepository.updateAssessment(assessmentId, updatedAssessment);

  const pool = getPool();
  await pool.query(
    `UPDATE assessment_attempts
     SET attempted_questions = $2,
         correct_answers = $3,
         incorrect_answers = $4,
         unanswered = $5,
         technical_score = $6,
         status = 'completed',
         submitted_at = NOW()
     WHERE id = (
       SELECT id
       FROM assessment_attempts
       WHERE assessment_id = $1
       ORDER BY created_at DESC
       LIMIT 1
     )`,
    [assessmentId, answers.length, correct, incorrect, unanswered, technicalTestScore],
  );

  const resultId = crypto.randomUUID ? crypto.randomUUID() : `result-${Date.now()}`;
  await pool.query(
    `INSERT INTO assessment_results (id, user_id, attempt_id, target_role, technical_test_score, project_score, internship_score, overall_score, skill_scores, strengths, weaknesses, status, created_at, updated_at)
     VALUES ($1, $2, (SELECT id FROM assessment_attempts WHERE assessment_id = $3 ORDER BY created_at DESC LIMIT 1), $4, $5, 0, 0, $6, $7, $8, $9, 'completed', NOW(), NOW())`,
    [
      resultId,
      Number(userId),
      assessmentId,
      assessment.skill,
      technicalTestScore,
      technicalTestScore,
      JSON.stringify(skillScores),
      JSON.stringify(strengths.length ? strengths : ['Keep practicing core concepts']),
      JSON.stringify(weaknesses.length ? weaknesses : ['No major gaps identified']),
    ],
  );

  const snapshotScore = technicalTestScore;
  await pool.query(
    `INSERT INTO student_score_snapshots (user_id, target_role, technical_test_score, project_score, internship_score, overall_score, current_rank, score_version, created_at, updated_at)
     VALUES ($1, $2, $3, 0, 0, $4, 0, 'v1', NOW(), NOW())
     ON CONFLICT (user_id, target_role, score_version) DO UPDATE SET
       technical_test_score = EXCLUDED.technical_test_score,
       project_score = EXCLUDED.project_score,
       internship_score = EXCLUDED.internship_score,
       overall_score = EXCLUDED.overall_score,
       updated_at = NOW()`,
    [Number(userId), assessment.skill, technicalTestScore, snapshotScore],
  );

  return {
    message: 'Assessment submitted successfully.',
    assessment: {
      id: updatedAssessment.id,
      skill: updatedAssessment.skill,
      status: updatedAssessment.status,
    },
    result,
  };
}

async function getAssessmentResult(userId, assessmentId) {
  const assessment = await assessmentRepository.getAssessmentById(assessmentId);

  if (!assessment) {
    throw new AppError('Assessment not found.', 404);
  }

  if (Number(assessment.userId) !== Number(userId)) {
    throw new AppError('You are not authorized to view this assessment result.', 403);
  }

  if (!assessment.result) {
    throw new AppError('Assessment result is not available yet.', 404);
  }

  return {
    assessmentId: assessment.id,
    skill: assessment.skill,
    difficulty: assessment.difficulty,
    status: assessment.status,
    ...assessment.result,
  };
}

async function getAssessmentHistory(userId) {
  const history = await assessmentRepository.getHistoryForUser(userId);

  return history.map((assessment) => ({
    id: assessment.id,
    skill: assessment.skill,
    difficulty: assessment.difficulty,
    status: assessment.status,
    createdAt: assessment.createdAt,
    score: assessment.result ? assessment.result.technicalTestScore ?? assessment.result.skillScore ?? null : null,
  }));
}

async function getLeaderboard() {
  const pool = getPool();
  if (!pool) {
    throw new AppError('Database configuration is missing.', 500);
  }

  const result = await pool.query(`
    SELECT s.user_id, u.name, s.target_role, s.overall_score, s.current_rank
    FROM student_score_snapshots s
    INNER JOIN users u ON u.id = s.user_id
    WHERE s.overall_score > 0
    ORDER BY s.overall_score DESC, s.created_at ASC
  `);

  return {
    entries: result.rows.map((row, index) => ({
      rank: index + 1,
      userId: Number(row.user_id),
      student: row.name,
      role: row.target_role,
      score: Number(row.overall_score || 0),
    })),
  };
}

async function getCurrentUserRank(userId) {
  const pool = getPool();
  if (!pool) {
    throw new AppError('Database configuration is missing.', 500);
  }

  const result = await pool.query(
    `SELECT target_role, overall_score, current_rank
     FROM student_score_snapshots
     WHERE user_id = $1
     ORDER BY overall_score DESC, updated_at DESC
     LIMIT 1`,
    [Number(userId)],
  );

  if (!result.rows[0]) {
    return { rank: null, score: 0, role: null };
  }

  const row = result.rows[0];
  const leaderboard = await getLeaderboard();
  const rankedEntry = leaderboard.entries.find((entry) => entry.userId === Number(userId) && entry.role === row.target_role);

  return {
    rank: rankedEntry ? rankedEntry.rank : Number(row.current_rank || 0),
    score: Number(row.overall_score || 0),
    role: row.target_role,
  };
}

module.exports = {
  generateAssessment,
  listTargetRoles,
  searchSkills,
  getSkillTopics,
  getTargetRoleDefinition,
  startAssessment,
  submitAssessment,
  getAssessmentResult,
  getAssessmentHistory,
  getLeaderboard,
  getCurrentUserRank,
};
