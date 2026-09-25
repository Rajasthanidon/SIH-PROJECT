const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { getPool } = require('../src/config/database');

test('registration persists a user row in PostgreSQL', async () => {
  const email = `dbpersist-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const agent = request.agent(app);

  const registerResponse = await agent.post('/api/auth/register').send({
    name: 'Database Persistence User',
    email,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    role: 'student',
  });

  assert.equal(registerResponse.status, 201, registerResponse.body?.error?.message || 'Registration failed unexpectedly.');

  const pool = getPool();
  assert.ok(pool, 'Expected PostgreSQL connection pool to exist.');

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  assert.equal(result.rows.length, 1, 'User row should be persisted to the users table.');
  assert.equal(result.rows[0].email, email);
  assert.equal(result.rows[0].role, 'student');
});
