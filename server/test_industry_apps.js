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
          cookie: setCookie[0] ? setCookie[0].split(';')[0] : cookie // keep existing cookie if no new one
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
    
    // 1. Industry Setup
    const indUser = {
      name: `Test Ind ${ts}`,
      email: `ind${ts}@test.com`,
      password: 'password123',
      username: `ind${ts}`,
      companyName: 'Test Corp',
      designation: 'HR'
    };
    
    console.log('Registering Industry...');
    await makeRequest('/auth/register/industry', 'POST', indUser);
    await pool.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE username = $1`, [indUser.username]);
    
    const indLogin = await makeRequest('/auth/login', 'POST', { username: indUser.username, password: indUser.password });
    const indCookie = indLogin.cookie;
    
    console.log('Creating job...');
    const jobData = {
      type: 'JOB',
      title: 'Backend Developer',
      company_name: 'Test Corp',
      description: 'Test job description',
      location: 'Remote',
      work_mode: 'Remote',
      openings: '',
      min_cgpa: '',
      status: 'PUBLISHED'
    };
    const jobRes = await makeRequest('/opportunities', 'POST', jobData, indCookie);
    const job = JSON.parse(jobRes.body).opportunity;
    console.log('Created Job ID:', job.id);

    // 2. Student Setup
    const stuUser = {
      name: `Test Student ${ts}`,
      email: `student${ts}@nita.ug.ac.in`,
      password: 'password123',
      username: `student${ts}`,
      enrollmentNumber: `ENR${ts}`,
      registrationNumber: `REG${ts}`,
      department: 'CSE'
    };

    console.log('Registering Student...');
    await makeRequest('/auth/register/student', 'POST', stuUser);
    await pool.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE username = $1`, [stuUser.username]);
    
    const stuLogin = await makeRequest('/auth/login', 'POST', { username: stuUser.username, password: stuUser.password });
    const stuCookie = stuLogin.cookie;
    const stuId = JSON.parse(stuLogin.body).user.id;

    console.log('Adding resume for student...');
    await pool.query(`
      INSERT INTO student_profiles (user_id, resume_file_url, target_role, parsed_skills, placement_readiness) 
      VALUES ($1, '/uploads/resumes/dummy2.pdf', 'Software Engineer', '[]', '{}')
      ON CONFLICT (user_id) DO UPDATE SET resume_file_url = EXCLUDED.resume_file_url
    `, [stuId]);

    console.log('Student applying for Job...');
    const applyRes = await makeRequest(`/opportunities/${job.id}/apply`, 'POST', {}, stuCookie);
    console.log('Apply Status:', applyRes.status);
    
    // 3. Industry Checks Dashboard
    console.log('Industry fetching applications...');
    const appsRes = await makeRequest('/industry/applications', 'GET', null, indCookie);
    console.log('Industry Applications Status:', appsRes.status);
    const apps = JSON.parse(appsRes.body).applications;
    console.log('Total applications found:', apps.length);
    
    const foundApp = apps.find(a => a.opportunityId === job.id);
    if (foundApp) {
      console.log('Found Application:', foundApp);
      console.log('--- TEST PASSED ---');
    } else {
      console.log('--- TEST FAILED --- Application not visible to Industry.');
    }
    
    // 4. Update status
    console.log('Updating application status to SELECTED...');
    const updateRes = await makeRequest(`/industry/applications/${foundApp.id}/feedback`, 'POST', { status: 'SELECTED' }, indCookie);
    console.log('Update Response:', updateRes.status, updateRes.body);

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
