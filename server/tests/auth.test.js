const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

function buildUserAgent() {
  return request.agent(app);
}

test('valid login returns authenticated session', async () => {
  const agent = buildUserAgent();

  const register = await agent.post('/api/auth/register').send({
    name: 'Test Student',
    email: 'student@example.com',
    password: 'Password123!',
    role: 'student',
  });

  assert.equal(register.status, 201);

  const login = await agent.post('/api/auth/login').send({
    email: 'student@example.com',
    password: 'Password123!',
  });

  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, 'student');
  assert.equal(login.body.user.email, 'student@example.com');
});

test('invalid login fails with a 401', async () => {
  const agent = buildUserAgent();

  await agent.post('/api/auth/register').send({
    name: 'Test Student 2',
    email: 'student2@example.com',
    password: 'Password123!',
    role: 'student',
  });

  const login = await agent.post('/api/auth/login').send({
    email: 'student2@example.com',
    password: 'WrongPassword123!',
  });

  assert.equal(login.status, 401);
});

test('logout destroys the session', async () => {
  const agent = buildUserAgent();

  await agent.post('/api/auth/register').send({
    name: 'Logout User',
    email: 'logout@example.com',
    password: 'Password123!',
    role: 'student',
  });

  await agent.post('/api/auth/login').send({
    email: 'logout@example.com',
    password: 'Password123!',
  });

  const logout = await agent.post('/api/auth/logout');
  assert.equal(logout.status, 200);

  const currentUser = await agent.get('/api/auth/me');
  assert.equal(currentUser.status, 401);
});

test('expired or missing session is rejected', async () => {
  const agent = buildUserAgent();

  const response = await agent.get('/api/auth/me');
  assert.equal(response.status, 401);
});

test('unauthorized route rejects unauthenticated access', async () => {
  const agent = buildUserAgent();

  const response = await agent.get('/api/student/profile');
  assert.equal(response.status, 401);
});

test('wrong role cannot access protected route', async () => {
  const agent = buildUserAgent();

  await agent.post('/api/auth/register').send({
    name: 'Faculty User',
    email: 'faculty@example.com',
    password: 'Password123!',
    role: 'faculty',
  });

  await agent.post('/api/auth/login').send({
    email: 'faculty@example.com',
    password: 'Password123!',
  });

  const response = await agent.get('/api/admin/users');
  assert.equal(response.status, 403);
});

test('admin role is not allowed through default public registration', async () => {
  const agent = buildUserAgent();

  const response = await agent.post('/api/auth/register').send({
    name: 'Super Admin',
    email: 'admin-default@example.com',
    password: 'Password123!',
    role: 'admin',
  });

  assert.equal(response.status, 400);
  assert.match(response.body.error.message, /admin/i);
});

test('duplicate email registration is rejected', async () => {
  const agent = buildUserAgent();

  const first = await agent.post('/api/auth/register').send({
    name: 'Duplicate User',
    email: 'duplicate@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    role: 'student',
  });

  assert.equal(first.status, 201);

  const second = await agent.post('/api/auth/register').send({
    name: 'Duplicate User Again',
    email: 'duplicate@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    role: 'student',
  });

  assert.equal(second.status, 409);
  assert.match(second.body.error.message, /already exists/i);
});

test('registration reject mismatched password confirmation', async () => {
  const agent = buildUserAgent();

  const response = await agent.post('/api/auth/register').send({
    name: 'Mismatch User',
    email: 'mismatch@example.com',
    password: 'Password123!',
    confirmPassword: 'WrongPassword123!',
    role: 'student',
  });

  assert.equal(response.status, 400);
  assert.match(response.body.error.message, /do not match/i);
});
