const { validateQuestionSet, normalizeDifficulty } = require('../utils/assessmentSchemas');

const DEFAULT_TOPICS = {
  JavaScript: ['Closures', 'Async Patterns', 'DOM Manipulation', 'ES6 Features'],
  React: ['React Patterns', 'State Management', 'Component Composition', 'Hooks'],
  'Node.js': ['API Design', 'Async I/O', 'Express Middleware', 'Error Handling'],
  Python: ['Data Structures', 'Algorithms', 'Testing', 'API Design'],
};

function buildTopicPrompt(skill, topic, difficulty, objective) {
  return {
    skill,
    topic,
    difficulty,
    objective,
    instruction: `Create a ${difficulty} assessment for ${skill} focusing on ${topic}. The response must be valid JSON with a "questions" array. Each question must have an id, skill, topic, type, prompt, difficulty, expectedCompetency, rubric, and metadata. The assessment should evaluate ${objective}.`,
  };
}

function buildFallbackQuestions({ skill, topics, difficulty, objective }) {
  const normalizedSkill = String(skill || '').trim() || 'General Skills';
  const normalizedTopics = Array.isArray(topics) && topics.length ? topics : DEFAULT_TOPICS[normalizedSkill] || ['Core Concepts'];
  const safeDifficulty = normalizeDifficulty(difficulty);

  const questions = normalizedTopics.slice(0, 3).map((topic, index) => ({
    id: `q-${index + 1}`,
    skill: normalizedSkill,
    topic: String(topic || '').trim() || `Topic ${index + 1}`,
    type: 'short-answer',
    prompt: `Explain ${String(topic || '').trim() || 'this topic'} in the context of ${normalizedSkill}. Include one practical example, one trade-off, and one implication for real-world usage.`,
    difficulty: safeDifficulty,
    expectedCompetency: safeDifficulty === 'advanced' ? 'analyze' : safeDifficulty === 'beginner' ? 'remember' : 'apply',
    rubric: 'Answer should define the concept, give a practical example, and explain trade-offs or implementation considerations.',
    metadata: {
      objective: objective || 'Assess topic readiness.',
      topicSpecific: true,
    },
  }));

  return {
    schemaVersion: '1.0',
    skill: normalizedSkill,
    difficulty: safeDifficulty,
    objective: String(objective || '').trim(),
    questions,
    provider: 'fallback',
  };
}

async function requestQuestionGeneration(rawConfig, attempt = 1) {
  const config = {
    skill: String(rawConfig.skill || '').trim(),
    topics: Array.isArray(rawConfig.topics) ? rawConfig.topics.filter(Boolean) : [],
    difficulty: normalizeDifficulty(rawConfig.difficulty),
    objective: String(rawConfig.objective || '').trim(),
  };

  if (!config.skill) {
    throw new Error('A skill is required to generate an assessment.');
  }

  try {
    if (process.env.AI_API_URL && process.env.AI_API_KEY) {
      const response = await fetch(process.env.AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'fallback-model',
          messages: config.topics.map((topic) => ({
            role: 'user',
            content: JSON.stringify(buildTopicPrompt(config.skill, topic, config.difficulty, config.objective)),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('AI provider rejected the request.');
      }

      const payload = await response.json();
      return validateQuestionSet(payload);
    }

    throw new Error('AI provider not configured.');
  } catch (error) {
    console.warn('[AI] Question generation failed, retrying safely.', {
      skill: config.skill,
      topics: config.topics.length,
      attempt,
      difficulty: config.difficulty,
    });

    if (attempt < 2) {
      return requestQuestionGeneration(config, attempt + 1);
    }

    return buildFallbackQuestions(config);
  }
}

async function generateQuestionSet(config) {
  const validatedConfig = {
    skill: String(config.skill || '').trim(),
    topics: Array.isArray(config.topics) ? config.topics.filter(Boolean).map(String) : [],
    difficulty: normalizeDifficulty(config.difficulty),
    objective: String(config.objective || '').trim(),
  };

  if (!validatedConfig.skill) {
    throw new Error('Skill is required.');
  }

  const fallbackResult = await requestQuestionGeneration(validatedConfig, 1);
  return validateQuestionSet(fallbackResult);
}

function getAssessmentKeywords(question) {
  const tokens = [
    String(question.skill || ''),
    String(question.topic || ''),
    String(question.expectedCompetency || ''),
    String(question.rubric || ''),
  ]
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  return [...new Set(tokens)];
}

module.exports = {
  generateQuestionSet,
  getAssessmentKeywords,
  buildFallbackQuestions,
};
