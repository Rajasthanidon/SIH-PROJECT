const request = require('supertest');
const app = require('../app');
const { getPool } = require('../config/database');

(async () => {
  const email = 'persist-' + Date.now() + '@example.com';
  const agent = request.agent(app);

  const register = await agent.post('/api/auth/register').send({
    name: 'Persist User',
    email,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    role: 'student',
  });

  console.log('REGISTER_STATUS', register.status, register.body?.message || register.body?.error?.message || '');

  const dbCheck = await getPool().query('SELECT COUNT(*) AS count FROM users WHERE email = $1', [email]);
  console.log('DB_COUNT', dbCheck.rows[0].count);

  const login = await agent.post('/api/auth/login').send({
    email,
    password: 'Password123!',
  });
  console.log('LOGIN_STATUS', login.status, login.body?.message || login.body?.error?.message || '');

  const freshApp = require('../app');
  const freshAgent = request.agent(freshApp);
  const freshLogin = await freshAgent.post('/api/auth/login').send({
    email,
    password: 'Password123!',
  });
  console.log('FRESH_LOGIN_STATUS', freshLogin.status, freshLogin.body?.message || freshLogin.body?.error?.message || '');

  const duplicate = await request(app).post('/api/auth/register').send({
    name: 'Duplicate User',
    email,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    role: 'student',
  });

  console.log('DUPLICATE_STATUS', duplicate.status, duplicate.body?.error?.message || duplicate.body?.message || '');

  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
