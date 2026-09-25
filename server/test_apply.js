require('dotenv').config();
const http = require('http');
const { Pool } = require('pg');

const API_BASE = 'http://localhost:4000/api';

function makeRequest(path, method, data, cookie) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }
    
    if (data) {
      const payload = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        let setCookie = res.headers['set-cookie'] || [];
        resolve({
          status: res.statusCode,
          body: responseBody,
          cookie: setCookie[0] ? setCookie[0].split(';')[0] : null
        });
      });
    });

    req.on('error', e => reject(e));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const ts = Date.now();
    const user = {
      name: `Test Student ${ts}`,
      email: `student${ts}@nita.ug.ac.in`,
      password: 'password123',
      username: `student${ts}`,
      enrollmentNumber: `ENR${ts}`,
      registrationNumber: `REG${ts}`,
      department: 'CSE',
      role: 'student'
    };

    console.log('Registering student...');
    await makeRequest('/auth/register/student', 'POST', user);

    console.log('Activating user in DB...');
    await pool.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE username = $1`, [user.username]);

    console.log('Logging in...');
    const loginRes = await makeRequest('/auth/login', 'POST', { username: user.username, password: user.password });
    const cookie = loginRes.cookie;
    
    if (loginRes.status !== 200) {
      console.log('Login failed:', loginRes.body);
      return;
    }
    
    const studentData = JSON.parse(loginRes.body);
    const userId = studentData.user.id;

    console.log('Attempting to apply without resume (should fail)...');
    const applyRes1 = await makeRequest('/opportunities/1/apply', 'POST', {}, cookie);
    console.log('Apply 1 Response:', applyRes1.status, applyRes1.body);

    console.log('Adding resume_file_url in DB...');
    await pool.query(`
      INSERT INTO student_profiles (user_id, resume_file_url, target_role, parsed_skills, placement_readiness) 
      VALUES ($1, '/uploads/resumes/dummy.pdf', 'Software Engineer', '[]', '{}')
      ON CONFLICT (user_id) DO UPDATE SET resume_file_url = EXCLUDED.resume_file_url
    `, [userId]);

    console.log('Attempting to apply with resume (should succeed)...');
    const applyRes2 = await makeRequest('/opportunities/1/apply', 'POST', {}, cookie);
    console.log('Apply 2 Response:', applyRes2.status, applyRes2.body);

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
