const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

function buildUserAgent() {
  return request.agent(app);
}

test('faculty role can read student profiles and skill analytics', async () => {
  const faculty = buildUserAgent();
  const student = buildUserAgent();

  await faculty.post('/api/auth/register').send({
    name: 'Faculty User',
    email: 'faculty-user@example.com',
    password: 'Password123!',
    role: 'faculty',
  });

  await faculty.post('/api/auth/login').send({
    email: 'faculty-user@example.com',
    password: 'Password123!',
  });

  await student.post('/api/auth/register').send({
    name: 'Student User',
    email: 'student-user@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await student.post('/api/auth/login').send({
    email: 'student-user@example.com',
    password: 'Password123!',
  });

  await student.put('/api/student/profile').send({
    targetRole: 'Frontend Developer',
    skills: [
      { name: 'JavaScript', level: 80 },
      { name: 'React', level: 76 },
      { name: 'TypeScript', level: 58 },
    ],
    topics: [
      { name: 'JavaScript', score: 80 },
      { name: 'React', score: 76 },
      { name: 'TypeScript', score: 58 },
    ],
  });

  const students = await faculty.get('/api/faculty/students');
  assert.equal(students.status, 200);
  assert.ok(Array.isArray(students.body.students));

  const profile = await faculty.get(`/api/faculty/students/${student.body?.user?.id || 2}/profile`);
  assert.equal(profile.status, 200);
  assert.ok(profile.body.student || profile.body.profile);

  const analytics = await faculty.get('/api/faculty/analytics');
  assert.equal(analytics.status, 200);
  assert.ok(analytics.body.analytics || analytics.body.summary);
});

test('placement cell can import student CSV and manage drive analytics', async () => {
  const placement = buildUserAgent();

  await placement.post('/api/auth/register').send({
    name: 'Placement User',
    email: 'placement-user@example.com',
    password: 'Password123!',
    role: 'placement',
  });

  await placement.post('/api/auth/login').send({
    email: 'placement-user@example.com',
    password: 'Password123!',
  });

  const csvImport = await placement.post('/api/placement/students/import').send({
    csv: 'name,email,role\nSam, sam@example.com, student\nMui, mui@example.com, student',
  });

  assert.equal(csvImport.status, 200);
  assert.ok(Array.isArray(csvImport.body.imported));

  const dashboard = await placement.get('/api/placement/dashboard');
  assert.equal(dashboard.status, 200);
  assert.ok(dashboard.body.dashboard || dashboard.body.summary);

  const analytics = await placement.get('/api/placement/analytics');
  assert.equal(analytics.status, 200);
  assert.ok(analytics.body.analytics || analytics.body.summary);
});
