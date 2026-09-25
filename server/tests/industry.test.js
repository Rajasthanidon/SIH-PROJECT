const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

function buildUserAgent() {
  return request.agent(app);
}

test('industry recruiter can manage company, opportunities, candidate search, shortlist, and feedback', async () => {
  const recruiter = buildUserAgent();
  const student = buildUserAgent();

  await recruiter.post('/api/auth/register').send({
    name: 'Recruiter One',
    email: 'recruiter-one@example.com',
    password: 'Password123!',
    role: 'industry',
  });

  await recruiter.post('/api/auth/login').send({
    email: 'recruiter-one@example.com',
    password: 'Password123!',
  });

  await student.post('/api/auth/register').send({
    name: 'Student Candidate',
    email: 'student-candidate@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await student.post('/api/auth/login').send({
    email: 'student-candidate@example.com',
    password: 'Password123!',
  });

  await student.put('/api/student/profile').send({
    targetRole: 'Frontend Developer',
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

  const company = await recruiter.put('/api/industry/company').send({
    companyName: 'Northstar Labs',
    industry: 'Software',
    website: 'https://northstar.example',
    location: 'Remote',
  });

  assert.equal(company.status, 200);
  assert.equal(company.body.company.companyName, 'Northstar Labs');

  const job = await recruiter.post('/api/industry/jobs').send({
    title: 'Frontend Developer',
    type: 'Full-time',
    location: 'Remote',
    status: 'draft',
    requiredSkills: ['JavaScript', 'React', 'TypeScript'],
    requiredTopics: ['JavaScript', 'React'],
    minimumProficiency: 70,
    eligibility: 'Open to all final-year students',
    preferredSkills: ['Testing'],
    companyId: company.body.company.id,
    description: 'Build accessible user-facing interfaces.',
  });

  assert.equal(job.status, 201);
  assert.equal(job.body.opportunity.title, 'Frontend Developer');

  const published = await recruiter.patch(`/api/industry/opportunities/${job.body.opportunity.id}/publish`);
  assert.equal(published.status, 200);
  assert.equal(published.body.opportunity.status, 'published');

  const candidates = await recruiter.get('/api/industry/candidates?role=Frontend%20Developer&skill=React');
  assert.equal(candidates.status, 200);
  assert.ok(Array.isArray(candidates.body.candidates));
  assert.ok(candidates.body.candidates.length >= 1);

  const candidate = candidates.body.candidates[0];
  assert.ok(candidate.scorecard && candidate.scorecard.score >= 0);

  const shortlist = await recruiter.post('/api/industry/shortlists').send({
    opportunityId: job.body.opportunity.id,
    candidateId: candidate.userId,
    reason: 'Strong React and JavaScript fit.',
  });

  assert.equal(shortlist.status, 201);
  assert.ok(Array.isArray(shortlist.body.shortlist));

  const applications = await recruiter.get('/api/industry/applications');
  assert.equal(applications.status, 200);
  assert.ok(Array.isArray(applications.body.applications));

  const feedback = await recruiter.post(`/api/industry/applications/${applications.body.applications[0].id}/feedback`).send({
    status: 'selected',
    feedback: 'Strong practical frontend quality and role alignment.',
  });

  assert.equal(feedback.status, 200);
  assert.equal(feedback.body.feedback.status, 'selected');
});

test('industry users cannot modify other recruiters company data', async () => {
  const recruiterOne = buildUserAgent();
  const recruiterTwo = buildUserAgent();

  await recruiterOne.post('/api/auth/register').send({
    name: 'Recruiter A',
    email: 'recruiter-a@example.com',
    password: 'Password123!',
    role: 'industry',
  });

  await recruiterTwo.post('/api/auth/register').send({
    name: 'Recruiter B',
    email: 'recruiter-b@example.com',
    password: 'Password123!',
    role: 'industry',
  });

  await recruiterOne.post('/api/auth/login').send({
    email: 'recruiter-a@example.com',
    password: 'Password123!',
  });

  await recruiterTwo.post('/api/auth/login').send({
    email: 'recruiter-b@example.com',
    password: 'Password123!',
  });

  const company = await recruiterOne.put('/api/industry/company').send({
    companyName: 'Own Company',
    industry: 'Fintech',
  });

  const unauthorized = await recruiterTwo.patch(`/api/industry/opportunities/${company.body.company.id}/close`);
  assert.equal(unauthorized.status, 403);
});
