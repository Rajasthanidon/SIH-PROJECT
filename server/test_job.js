require('dotenv').config();
const http = require('http');

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
  try {
    const ts = Date.now();
    const user = {
      name: `Test Ind ${ts}`,
      email: `ind${ts}@test.com`,
      password: 'password123',
      username: `ind${ts}`,
      companyName: 'Test Corp',
      designation: 'HR'
    };

    console.log('Registering...');
    await makeRequest('/auth/register/industry', 'POST', user);

    // Skip email verification step for the script if the DB requires it, but in our code it says pending verification.
    // Wait, let's manually activate the user in DB via script.
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/academia_industry' });
    await pool.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE username = $1`, [user.username]);

    console.log('Logging in...');
    const loginRes = await makeRequest('/auth/login', 'POST', { username: user.username, password: user.password });
    console.log('Login Response:', loginRes.status, loginRes.body);
    
    const cookie = loginRes.cookie;
    if (!cookie) throw new Error('No cookie received');

    console.log('Creating job...');
    const jobData = {
      type: 'JOB',
      title: 'Software Engineer',
      company_name: 'Test Corp',
      description: 'Test job description',
      location: 'Remote',
      work_mode: 'Remote',
      openings: '',
      min_cgpa: '',
      status: 'PUBLISHED'
    };
    
    const jobRes = await makeRequest('/opportunities', 'POST', jobData, cookie);
    console.log('Create Job Response:', jobRes.status, jobRes.body);
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
