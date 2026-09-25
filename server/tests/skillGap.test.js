const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

function buildUserAgent() {
  return request.agent(app);
}

test('student skill gap analysis compares strengths and gaps against target role requirements', async () => {
  const agent = buildUserAgent();

  await agent.post('/api/auth/register').send({
    name: 'Skill Gap User',
    email: 'skill-gap-user@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await agent.post('/api/auth/login').send({
    email: 'skill-gap-user@example.com',
    password: 'Password123!',
  });

  await agent.put('/api/student/profile').send({
    targetRole: 'Frontend Developer',
    academicInfo: {
      university: 'Example University',
      degree: 'CS',
    },
    skills: [
      { name: 'JavaScript', level: 82 },
      { name: 'React', level: 74 },
      { name: 'TypeScript', level: 48 },
      { name: 'Testing', level: 35 },
    ],
    topics: [
      { name: 'JavaScript', score: 82 },
      { name: 'React', score: 74 },
      { name: 'TypeScript', score: 48 },
      { name: 'Testing', score: 35 },
    ],
  });

  const response = await agent.get('/api/student/skill-gap');

  assert.equal(response.status, 200);
  assert.equal(response.body.analysis.targetRole, 'Frontend Developer');
  assert.ok(Array.isArray(response.body.analysis.matchedSkills));
  assert.ok(Array.isArray(response.body.analysis.skillGaps));
  assert.ok(response.body.analysis.skillGaps.some((item) => item.name === 'TypeScript' || item.name === 'Testing'));
  assert.ok(Array.isArray(response.body.analysis.priorityGaps));
  assert.ok(Array.isArray(response.body.analysis.recommendedImprovementAreas));
  assert.ok(response.body.analysis.explainable === true);
});

test('skill gap analysis rejects a student without a target role', async () => {
  const agent = buildUserAgent();

  await agent.post('/api/auth/register').send({
    name: 'No Role User',
    email: 'no-role-user@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await agent.post('/api/auth/login').send({
    email: 'no-role-user@example.com',
    password: 'Password123!',
  });

  const response = await agent.get('/api/student/skill-gap');

  assert.equal(response.status, 400);
  assert.match(response.body.error.message, /target role/i);
});
