const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:4000';

function request(method, reqPath, body = null, cookie = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${reqPath}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + (url.search || ''),
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'] || [];
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: resData,
          cookie: setCookie[0] ? setCookie[0].split(';')[0] : null,
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runSecurityTests() {
  console.log('=== PHASE 20 SECURITY & AUTHORIZATION TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Security Headers Test
  const rootRes = await request('GET', '/');
  assert(rootRes.headers['x-content-type-options'] === 'nosniff', 'Header X-Content-Type-Options: nosniff present');
  assert(rootRes.headers['x-frame-options'] === 'SAMEORIGIN', 'Header X-Frame-Options: SAMEORIGIN present');
  assert(rootRes.headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Header Referrer-Policy present');
  assert(rootRes.headers['x-xss-protection'] === '0', 'Header X-XSS-Protection: 0 present');
  assert(!rootRes.headers['x-powered-by'], 'Header X-Powered-By is hidden/removed');

  // 2. Setup dummy resume file for test
  const resumesDir = path.resolve(__dirname, '../server/uploads/resumes');
  if (!fs.existsSync(resumesDir)) {
    fs.mkdirSync(resumesDir, { recursive: true });
  }
  const testFileName = 'security_test_resume.pdf';
  fs.writeFileSync(path.join(resumesDir, testFileName), '%PDF-1.4 Mock resume content for Phase 20 security audit');

  // 3. File Security: Unauthenticated access to /uploads/resumes/:filename
  const unauthRes = await request('GET', `/uploads/resumes/${testFileName}`);
  assert(unauthRes.status === 401, `Unauthenticated resume access blocked: Expected 401, Got ${unauthRes.status}`);

  // 4. File Security: Path traversal protection
  const traversalRes = await request('GET', '/uploads/resumes/..%2f..%2fpackage.json');
  assert(traversalRes.status === 400 || traversalRes.status === 404, `Path traversal blocked: Expected 400/404, Got ${traversalRes.status}`);

  // 5. Authenticate Student A (userId 50)
  const loginStudentA = await request('POST', '/api/auth/login', {
    username: 'student1790345650939',
    password: 'password123',
  });
  const cookieStudentA = loginStudentA.cookie;
  assert(loginStudentA.status === 200 && cookieStudentA, 'Student A login successful');

  // Associate test resume with Student A in student_profiles
  const { Pool } = require('../server/node_modules/pg');
  require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query('UPDATE student_profiles SET resume_file_url = $1 WHERE user_id = $2', [
    `/uploads/resumes/${testFileName}`,
    50,
  ]);

  // 6. Authorized access: Student A accesses own resume
  const authResumeRes = await request('GET', `/uploads/resumes/${testFileName}`, null, cookieStudentA);
  assert(authResumeRes.status === 200, `Student A accessing own resume: Expected 200, Got ${authResumeRes.status}`);
  assert(authResumeRes.headers['content-type'] === 'application/pdf', 'Content-Type is application/pdf');

  // Also via /api/files/resume/:filename
  const apiResumeRes = await request('GET', `/api/files/resume/${testFileName}`, null, cookieStudentA);
  assert(apiResumeRes.status === 200, `Student A accessing own resume via /api/files/resume: Expected 200, Got ${apiResumeRes.status}`);

  // 7. Unauthorized access: Student B (userId 56) tries to access Student A's resume
  const loginStudentB = await request('POST', '/api/auth/login', {
    username: 'st_1790356975100',
    password: 'password123',
  });
  const cookieStudentB = loginStudentB.cookie;
  if (cookieStudentB) {
    const studentBResumeRes = await request('GET', `/uploads/resumes/${testFileName}`, null, cookieStudentB);
    assert(studentBResumeRes.status === 403, `Student B accessing Student A resume (IDOR): Expected 403, Got ${studentBResumeRes.status}`);
  }

  // 8. Admin access: Admin accesses Student A's resume
  // Find or create admin login
  const adminRes = await pool.query('SELECT username FROM users WHERE role = \'admin\' AND status = \'ACTIVE\' LIMIT 1');
  if (adminRes.rows[0]) {
    const adminUser = adminRes.rows[0].username;
    const loginAdmin = await request('POST', '/api/auth/login', {
      username: adminUser,
      password: 'password123',
    });
    if (loginAdmin.status === 200 && loginAdmin.cookie) {
      const adminFileRes = await request('GET', `/uploads/resumes/${testFileName}`, null, loginAdmin.cookie);
      assert(adminFileRes.status === 200, `Admin accessing student resume: Expected 200, Got ${adminFileRes.status}`);
    }
  }

  // 9. Rate Limiter Test
  console.log('\n--- Rate Limiting Verification ---');
  let hitRateLimit = false;
  for (let i = 1; i <= 25; i++) {
    const rateRes = await request('POST', '/api/auth/login', {
      username: 'wronguser',
      password: 'wrongpassword',
    }, null, { 'x-test-rate-limit': 'true' });

    if (rateRes.status === 429) {
      hitRateLimit = true;
      assert(rateRes.status === 429, `Rate limiter triggered on attempt ${i}: Got 429 Too Many Requests`);
      assert(rateRes.headers['retry-after'], `Retry-After header present: ${rateRes.headers['retry-after']}s`);
      break;
    }
  }
  assert(hitRateLimit, 'Rate limiter correctly capped brute-force requests at 429');

  // Clean up test file
  if (fs.existsSync(path.join(resumesDir, testFileName))) {
    fs.unlinkSync(path.join(resumesDir, testFileName));
  }
  await pool.end();

  console.log(`\nSecurity Tests Summary: ${passed} Passed, ${failed} Failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runSecurityTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
