const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

function buildUserAgent() {
  return request.agent(app);
}

test('student assessment lifecycle generates, evaluates, and stores validated results', async () => {
  const agent = buildUserAgent();

  await agent.post('/api/auth/register').send({
    name: 'Assessment User',
    email: 'assessment-user@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await agent.post('/api/auth/login').send({
    email: 'assessment-user@example.com',
    password: 'Password123!',
  });

  const generate = await agent.post('/api/assessments/generate').send({
    skill: 'JavaScript',
    topics: ['React Patterns', 'API Design'],
    difficulty: 'intermediate',
    objective: 'Assess core frontend engineering readiness.',
  });

  assert.equal(generate.status, 201);
  assert.equal(generate.body.assessment.skill, 'JavaScript');
  assert.ok(Array.isArray(generate.body.assessment.questions));
  assert.ok(generate.body.assessment.questions.length >= 2);

  const assessmentId = generate.body.assessment.id;

  const answers = generate.body.assessment.questions.map((question) => ({
    questionId: question.id,
    answer: `I understand ${question.topic} and explain it clearly using best practices and examples.`,
  }));

  const submit = await agent.post(`/api/assessments/${assessmentId}/submit`).send({
    answers,
  });

  assert.equal(submit.status, 200);
  assert.ok(submit.body.result.topicScores.length >= 1);
  assert.ok(typeof submit.body.result.skillScore === 'number');
  assert.ok(Array.isArray(submit.body.result.strengths));
  assert.ok(Array.isArray(submit.body.result.weaknesses));

  const result = await agent.get(`/api/assessments/${assessmentId}/result`);
  assert.equal(result.status, 200);
  assert.equal(result.body.result.assessmentId, assessmentId);
  assert.ok(typeof result.body.result.skillScore === 'number');

  const history = await agent.get('/api/assessments/history');
  assert.equal(history.status, 200);
  assert.ok(Array.isArray(history.body.history));
});
