const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

function buildUserAgent() {
  return request.agent(app);
}

test('student can manage profile and dashboard data', async () => {
  const agent = buildUserAgent();

  await agent.post('/api/auth/register').send({
    name: 'Student Profile User',
    email: 'student-profile@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await agent.post('/api/auth/login').send({
    email: 'student-profile@example.com',
    password: 'Password123!',
  });

  const emptyProfile = await agent.get('/api/student/profile');
  assert.equal(emptyProfile.status, 200);
  assert.equal(emptyProfile.body.profile.userId, 1);

  const updatedProfile = await agent.put('/api/student/profile').send({
    academicInfo: {
      university: 'National Institute of Technology',
      degree: 'B.Tech in Computer Science',
      graduationYear: 2027,
      cgpa: 8.9,
      department: 'CSE',
    },
    careerGoal: 'Become a product-focused software engineer in AI-driven applications.',
    targetRole: 'Frontend Engineer',
    skills: ['JavaScript', 'React', 'Node.js', 'SQL'],
    topics: ['React Patterns', 'API Design', 'Data Structures'],
  });

  assert.equal(updatedProfile.status, 200);
  assert.equal(updatedProfile.body.profile.targetRole, 'Frontend Engineer');

  const dashboard = await agent.get('/api/student/dashboard');
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.dashboard.targetRole, 'Frontend Engineer');
  assert.ok(dashboard.body.dashboard.overallReadiness >= 0);

  const skills = await agent.get('/api/student/skills');
  assert.equal(skills.status, 200);
  assert.ok(skills.body.skills.length >= 1);

  const updatedSkills = await agent.put('/api/student/skills').send({
    skills: [
      { name: 'JavaScript', level: 82, confidence: 0.8 },
      { name: 'React', level: 88, confidence: 0.9 },
      { name: 'Node.js', level: 74, confidence: 0.7 },
    ],
  });

  assert.equal(updatedSkills.status, 200);
  assert.equal(updatedSkills.body.skills[0].name, 'JavaScript');

  const topics = await agent.get('/api/student/topics');
  assert.equal(topics.status, 200);
  assert.ok(Array.isArray(topics.body.topics));

  const updatedTopics = await agent.put('/api/student/topics').send({
    topics: [
      { name: 'React Patterns', score: 90, mastery: 'Strong' },
      { name: 'API Design', score: 75, mastery: 'Moderate' },
      { name: 'Data Structures', score: 68, mastery: 'Developing' },
    ],
  });

  assert.equal(updatedTopics.status, 200);
  assert.equal(updatedTopics.body.topics[0].name, 'React Patterns');

  const projectCreate = await agent.post('/api/student/projects').send({
    title: 'Skill roadmap app',
    description: 'Built a career readiness dashboard for students.',
    link: 'https://example.com/project',
    technologies: ['React', 'Node.js'],
    impact: 'Improved skill tracking UX',
  });

  assert.equal(projectCreate.status, 201);

  const projects = await agent.get('/api/student/projects');
  assert.equal(projects.status, 200);
  assert.ok(projects.body.projects.length >= 1);

  const internshipCreate = await agent.post('/api/student/internships').send({
    company: 'OpenAI',
    role: 'Frontend Intern',
    duration: '3 months',
    status: 'Completed',
    description: 'Worked on product mockups and analytics UI.',
  });

  assert.equal(internshipCreate.status, 201);

  const internships = await agent.get('/api/student/internships');
  assert.equal(internships.status, 200);
  assert.ok(internships.body.internships.length >= 1);

  const certificationCreate = await agent.post('/api/student/certifications').send({
    name: 'Meta Front-End Developer',
    issuer: 'Meta',
    year: 2025,
    credentialUrl: 'https://example.com/meta-cert',
  });

  assert.equal(certificationCreate.status, 201);

  const certifications = await agent.get('/api/student/certifications');
  assert.equal(certifications.status, 200);
  assert.ok(certifications.body.certifications.length >= 1);

  const portfolio = await agent.get('/api/student/portfolio');
  assert.equal(portfolio.status, 200);
  assert.equal(portfolio.body.portfolio.targetRole, 'Frontend Engineer');
  assert.ok(Array.isArray(portfolio.body.portfolio.projects));
});
