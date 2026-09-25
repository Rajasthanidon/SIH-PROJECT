const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

function buildUserAgent() {
  return request.agent(app);
}

test('student can search skills and start a topic-wise skill assessment', async () => {
  const agent = buildUserAgent();

  await agent.post('/api/auth/register').send({
    name: 'Skill Assessment Student',
    email: 'skill-assessment-student@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await agent.post('/api/auth/login').send({
    email: 'skill-assessment-student@example.com',
    password: 'Password123!',
  });

  const skillsResponse = await agent.get('/api/assessments/skills').query({ q: 'JavaScript' });
  assert.equal(skillsResponse.status, 200);
  assert.ok(Array.isArray(skillsResponse.body.skills));
  assert.ok(skillsResponse.body.skills.some((skill) => skill.name === 'JavaScript'));

  const topicsResponse = await agent.get('/api/assessments/skills/JavaScript/topics');
  assert.equal(topicsResponse.status, 200);
  assert.ok(Array.isArray(topicsResponse.body.topics));
  assert.ok(topicsResponse.body.topics.length > 0);

  const started = await agent.post('/api/assessments/start').send({
    skill: 'JavaScript',
    difficulty: 'easy',
    topics: ['Closures', 'Async Patterns'],
    questionCount: 2,
  });

  assert.equal(started.status, 201);
  assert.ok(started.body.assessment);
  assert.equal(started.body.assessment.skill, 'JavaScript');
  assert.ok(Array.isArray(started.body.assessment.questions));
  assert.ok(started.body.assessment.questions.length >= 2);
  assert.ok(started.body.assessment.questions.every((question) => ['Closures', 'Async Patterns'].includes(question.topic)));

  const submitted = await agent.post(`/api/assessments/${started.body.assessment.id}/submit`).send({
    answers: started.body.assessment.questions.map((question) => ({
      questionId: question.id,
      answer: question.options[0] || 'Option A',
    })),
  });

  assert.equal(submitted.status, 200);
  assert.ok(submitted.body.result);
  assert.ok(typeof submitted.body.result.technicalTestScore === 'number');
});

test('student can fetch target roles and start a deterministic assessment', async () => {
  const agent = buildUserAgent();

  await agent.post('/api/auth/register').send({
    name: 'Assessment Student',
    email: 'assessment-student@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await agent.post('/api/auth/login').send({
    email: 'assessment-student@example.com',
    password: 'Password123!',
  });

  const rolesResponse = await agent.get('/api/assessments/roles');
  assert.equal(rolesResponse.status, 200);
  assert.ok(Array.isArray(rolesResponse.body.roles));
  assert.ok(rolesResponse.body.roles.some((role) => role.name === 'Full Stack Developer'));

  const detailsResponse = await agent.get('/api/assessments/roles/Full%20Stack%20Developer');
  assert.equal(detailsResponse.status, 200);
  assert.ok(Array.isArray(detailsResponse.body.skills));
  assert.ok(detailsResponse.body.skills.some((skill) => skill.name === 'JavaScript'));

  const started = await agent.post('/api/assessments/start').send({
    targetRole: 'Full Stack Developer',
    difficulty: 'medium',
    questionCount: 3,
  });

  assert.equal(started.status, 201);
  assert.ok(started.body.assessment);
  assert.ok(Array.isArray(started.body.assessment.questions));
  assert.ok(started.body.assessment.questions.length >= 3);

  const submitted = await agent.post(`/api/assessments/${started.body.assessment.id}/submit`).send({
    answers: started.body.assessment.questions.map((question, index) => ({
      questionId: question.id,
      answer: index === 0 ? question.options[0] : question.options[question.options.length - 1],
    })),
  });

  assert.equal(submitted.status, 200);
  assert.ok(submitted.body.result);
  assert.ok(typeof submitted.body.result.technicalTestScore === 'number');
  assert.ok(Array.isArray(submitted.body.result.skillScores));
});

test('leaderboard can be generated from persisted assessment results', async () => {
  const agent = buildUserAgent();

  await agent.post('/api/auth/register').send({
    name: 'Leaderboard User',
    email: 'leaderboard-user@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await agent.post('/api/auth/login').send({
    email: 'leaderboard-user@example.com',
    password: 'Password123!',
  });

  const started = await agent.post('/api/assessments/start').send({
    targetRole: 'Full Stack Developer',
    difficulty: 'easy',
    questionCount: 2,
  });

  await agent.post(`/api/assessments/${started.body.assessment.id}/submit`).send({
    answers: started.body.assessment.questions.map((question) => ({
      questionId: question.id,
      answer: question.options[0],
    })),
  });

  const leaderboard = await agent.get('/api/assessments/leaderboard');
  assert.equal(leaderboard.status, 200);
  assert.ok(Array.isArray(leaderboard.body.entries));

  const rank = await agent.get('/api/assessments/rank');
  assert.equal(rank.status, 200);
  assert.ok(rank.body.rank !== undefined);
});

test('student can complete the full evidence-backed assessment journey', async () => {
  const agent = buildUserAgent();

  await agent.post('/api/auth/register').send({
    name: 'Full Journey Student',
    email: 'full-journey-student@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await agent.post('/api/auth/login').send({
    email: 'full-journey-student@example.com',
    password: 'Password123!',
  });

  await agent.put('/api/student/profile').send({
    targetRole: 'Full Stack Developer',
    academicInfo: { university: 'State University', degree: 'B.Tech', graduationYear: 2027 },
    careerGoal: 'Build product engineering experiences.',
  });

  await agent.put('/api/student/skills').send({
    skills: [
      { name: 'JavaScript', level: 70, confidence: 0.7 },
      { name: 'React', level: 65, confidence: 0.6 },
      { name: 'Node.js', level: 74, confidence: 0.7 },
    ],
  });

  const createdProject = await agent.post('/api/student/projects').send({
    title: 'Campus Commerce Portal',
    description: 'Built a product dashboard for campus commerce.',
    technologies: ['React', 'Node.js', 'PostgreSQL'],
    githubUrl: 'https://github.com/example/campus-commerce',
    liveUrl: 'https://example.com/commerce',
    studentContribution: 'Designed the product flow and integrated the API layer.',
    duration: '8 weeks',
  });

  assert.equal(createdProject.status, 201);

  const createdInternship = await agent.post('/api/student/internships').send({
    company: 'CloudNova',
    role: 'Frontend Intern',
    duration: '3 months',
    responsibilities: ['Built dashboards', 'Integrated API flows', 'Reviewed UX'],
    skillsUsed: ['React', 'JavaScript', 'REST APIs'],
    description: 'Worked on product UI and data integration for internal tools.',
    evidence: 'https://example.com/certificate',
  });

  assert.equal(createdInternship.status, 201);

  const started = await agent.post('/api/assessments/start').send({
    targetRole: 'Full Stack Developer',
    difficulty: 'medium',
    questionCount: 3,
  });

  assert.equal(started.status, 201);
  assert.ok(started.body.assessment.questions.length >= 3);

  const submittedAssessment = await agent.post(`/api/assessments/${started.body.assessment.id}/submit`).send({
    answers: started.body.assessment.questions.map((question) => ({
      questionId: question.id,
      answer: question.options[0],
    })),
  });

  assert.equal(submittedAssessment.status, 200);
  assert.ok(typeof submittedAssessment.body.result.technicalTestScore === 'number');

  const projectId = createdProject.body.project.id;
  const projectSubmission = await agent.post(`/api/student/projects/${projectId}/submit`);
  assert.equal(projectSubmission.status, 200);
  assert.ok(typeof projectSubmission.body.evaluation.score === 'number');

  const internshipId = createdInternship.body.internship.id;
  const internshipSubmission = await agent.post(`/api/student/internships/${internshipId}/submit`);
  assert.equal(internshipSubmission.status, 200);
  assert.ok(typeof internshipSubmission.body.evaluation.score === 'number');

  const dashboard = await agent.get('/api/student/dashboard');
  assert.equal(dashboard.status, 200);
  assert.ok(typeof dashboard.body.dashboard.technicalScore === 'number');
  assert.ok(typeof dashboard.body.dashboard.projectScore === 'number');
  assert.ok(typeof dashboard.body.dashboard.internshipScore === 'number');
  assert.ok(typeof dashboard.body.dashboard.overallScore === 'number');
  assert.ok(Array.isArray(dashboard.body.dashboard.selfDeclaredSkills));
  assert.ok(Array.isArray(dashboard.body.dashboard.assessedSkills));

  const leaderboard = await agent.get('/api/assessments/leaderboard');
  assert.equal(leaderboard.status, 200);
  assert.ok(Array.isArray(leaderboard.body.entries));

  const rank = await agent.get('/api/assessments/rank');
  assert.equal(rank.status, 200);
  assert.ok(rank.body.rank !== undefined);
});
