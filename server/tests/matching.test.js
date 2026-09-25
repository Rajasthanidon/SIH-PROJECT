const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

function buildUserAgent() {
  return request.agent(app);
}

test('matching engine produces a deterministic explainable score for a candidate and opportunity', async () => {
  const recruiter = buildUserAgent();
  const student = buildUserAgent();

  await recruiter.post('/api/auth/register').send({
    name: 'Recruiter Demo',
    email: 'matching-recruiter@example.com',
    password: 'Password123!',
    role: 'industry',
  });

  await recruiter.post('/api/auth/login').send({
    email: 'matching-recruiter@example.com',
    password: 'Password123!',
  });

  await student.post('/api/auth/register').send({
    name: 'Student Demo',
    email: 'matching-student@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await student.post('/api/auth/login').send({
    email: 'matching-student@example.com',
    password: 'Password123!',
  });

  await student.put('/api/student/profile').send({
    targetRole: 'Frontend Developer',
    skills: [
      { name: 'JavaScript', level: 92 },
      { name: 'React', level: 88 },
      { name: 'REST API', level: 82 },
      { name: 'TypeScript', level: 64 },
      { name: 'Automated Testing', level: 32 },
    ],
    topics: [
      { name: 'JavaScript', score: 92 },
      { name: 'React', score: 88 },
      { name: 'REST API', score: 82 },
      { name: 'TypeScript', score: 64 },
      { name: 'Automated Testing', score: 32 },
    ],
    projects: [
      { name: 'Commerce dashboard', skills: ['JavaScript', 'React'] },
      { name: 'API gateway', skills: ['REST API'] },
    ],
    internships: [{ name: 'Frontend internship', skills: ['React'] }],
    certifications: [{ name: 'React Fundamentals' }],
  });

  const company = await recruiter.put('/api/industry/company').send({
    companyName: 'Edgeworks',
    industry: 'Software',
    location: 'Remote',
  });

  const opportunity = await recruiter.post('/api/industry/jobs').send({
    title: 'Frontend Developer',
    type: 'Full-time',
    location: 'Remote',
    status: 'draft',
    requiredSkills: ['JavaScript', 'React', 'REST API', 'TypeScript', 'Automated Testing'],
    requiredTopics: ['JavaScript', 'React', 'REST API', 'TypeScript', 'Automated Testing'],
    minimumProficiency: 70,
    eligibility: 'Open to students with frontend development experience and relevant project evidence.',
    preferredSkills: ['Testing'],
    description: 'Build user-facing product features and work with API integrations.',
  });

  const me = await student.get('/api/auth/me');
  const response = await recruiter.get(`/api/matching/candidate/${me.body.user.id}/opportunity/${opportunity.body.opportunity.id}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.match.score, 82);
  assert.equal(response.body.match.eligibilityStatus, 'eligible');
  assert.equal(response.body.match.skillMatch.matched.length, 3);
  assert.equal(response.body.match.skillMatch.partial.length, 1);
  assert.equal(response.body.match.skillMatch.gap.length, 1);
  assert.ok(Array.isArray(response.body.match.explanation));
  assert.ok(response.body.match.explanation.some((item) => item.includes('JavaScript')));
});

test('student recommendations endpoint returns actionable improvement guidance', async () => {
  const student = buildUserAgent();

  await student.post('/api/auth/register').send({
    name: 'Recommended Student',
    email: 'recommended-student@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await student.post('/api/auth/login').send({
    email: 'recommended-student@example.com',
    password: 'Password123!',
  });

  await student.put('/api/student/profile').send({
    targetRole: 'Frontend Developer',
    skills: [
      { name: 'JavaScript', level: 80 },
      { name: 'React', level: 76 },
      { name: 'TypeScript', level: 58 },
      { name: 'Automated Testing', level: 41 },
    ],
    topics: [
      { name: 'JavaScript', score: 80 },
      { name: 'React', score: 76 },
      { name: 'TypeScript', score: 58 },
      { name: 'Automated Testing', score: 41 },
    ],
  });

  const recommendations = await student.get('/api/student/recommendations');

  assert.equal(recommendations.status, 200);
  assert.ok(Array.isArray(recommendations.body.recommendations));
  assert.ok(recommendations.body.recommendations.some((item) => item.title.includes('TypeScript') || item.title.includes('Testing')));
});
