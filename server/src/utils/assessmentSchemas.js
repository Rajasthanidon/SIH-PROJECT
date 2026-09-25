function normalizeDifficulty(value) {
  const difficulty = String(value || '').trim().toLowerCase();
  const normalizedMap = {
    beginner: 'easy',
    easy: 'easy',
    intermediate: 'medium',
    medium: 'medium',
    advanced: 'hard',
    hard: 'hard',
  };

  return normalizedMap[difficulty] || 'medium';
}

function validateQuestionSet(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('AI response must be an object.');
  }

  if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
    throw new Error('AI response must include at least one question.');
  }

  const validQuestions = payload.questions.map((question, index) => {
    if (!question || typeof question !== 'object') {
      throw new Error(`Question ${index + 1} is invalid.`);
    }

    const id = String(question.id || `q-${index + 1}`);
    const skill = String(question.skill || '').trim();
    const topic = String(question.topic || '').trim();
    const type = String(question.type || 'short-answer').trim();
    const prompt = String(question.prompt || '').trim();
    const difficulty = normalizeDifficulty(question.difficulty);

    if (!skill || !topic || !prompt) {
      throw new Error(`Question ${index + 1} is missing required fields.`);
    }

    if (!['short-answer', 'mcq', 'coding'].includes(type)) {
      throw new Error(`Question ${index + 1} has an unsupported question type.`);
    }

    return {
      id,
      skill,
      topic,
      type,
      prompt,
      difficulty,
      expectedCompetency: String(question.expectedCompetency || 'apply').trim(),
      rubric: String(question.rubric || 'Provide a structured answer with examples.').trim(),
      metadata: question.metadata || {},
    };
  });

  return {
    schemaVersion: '1.0',
    skill: String(payload.skill || '').trim() || validQuestions[0].skill,
    difficulty: normalizeDifficulty(payload.difficulty),
    questions: validQuestions,
    objective: String(payload.objective || '').trim(),
    provider: String(payload.provider || 'fallback').trim(),
  };
}

function validateAnswerPayload(payload = []) {
  if (!Array.isArray(payload)) {
    throw new Error('Answers must be provided as an array.');
  }

  return payload.map((answer, index) => {
    if (!answer || typeof answer !== 'object') {
      throw new Error(`Answer ${index + 1} is invalid.`);
    }

    const questionId = String(answer.questionId || '').trim();
    const response = String(answer.answer || '').trim();

    if (!questionId || response.length === 0) {
      throw new Error(`Answer ${index + 1} is missing a question ID or response.`);
    }

    return {
      questionId,
      answer: response,
    };
  });
}

module.exports = {
  normalizeDifficulty,
  validateQuestionSet,
  validateAnswerPayload,
};
