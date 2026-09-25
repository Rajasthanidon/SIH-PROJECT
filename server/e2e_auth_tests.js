const http = require('http');

let sessionCookie = ''; // Store the cookie

function request(method, path, data = null, useSession = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (useSession && sessionCookie) {
      options.headers['Cookie'] = sessionCookie;
    }
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      const payload = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          if (body) json = JSON.parse(body);
        } catch(e) {}

        // Save session cookie if provided
        if (res.headers['set-cookie']) {
          sessionCookie = res.headers['set-cookie'][0].split(';')[0];
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || body
        });
      });
    });

    req.on('error', reject);
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function clearSession() {
  sessionCookie = '';
}

async function runTests() {
  const ts = Date.now();
  
  // Test Accounts
  const student = { name: 'Test Student', email: `student_${ts}@nita.ug.ac.in`, username: `st_${ts}`, password: 'password123', enrollmentNumber: 'ENR' + ts, registrationNumber: 'REG' + ts, department: 'CSE' };
  const faculty = { name: 'Test Faculty', email: `faculty_${ts}@nita.ac.in`, username: `fac_${ts}`, password: 'password123', department: 'CSE', designation: 'Professor' };
  const industry = { name: 'Test Industry', email: `industry_${ts}@tech.com`, username: `ind_${ts}`, password: 'password123', companyName: 'TechCorp', designation: 'HR' };
  const placement = { name: 'Test Placement', email: `placement_${ts}@nita.ac.in`, username: `pl_${ts}`, password: 'password123', designation: 'Coordinator' };

  console.log('--- E2E AUTHENTICATION & LIFECYCLE TESTS ---');

  // Helper for verification token extraction directly from DB since emails aren't sent
  const { getPool } = require('./src/config/database');
  const pool = getPool();

  async function getVerificationToken(username) {
    const res = await pool.query('SELECT ev.token_hash FROM email_verifications ev JOIN users u ON ev.user_id = u.id WHERE u.username = $1', [username]);
    return res.rows[0]?.token_hash;
  }
  
  async function getUserId(username) {
    const res = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    return res.rows[0]?.id;
  }
  
  async function getUserState(username) {
    const res = await pool.query('SELECT status, is_active, email_verified, role FROM users WHERE username = $1', [username]);
    return res.rows[0];
  }

  async function approveUser(username) {
    const id = await getUserId(username);
    await pool.query(`UPDATE users SET status = 'ACTIVE', is_active = TRUE WHERE id = $1`, [id]);
  }
  
  async function suspendUser(username) {
    const id = await getUserId(username);
    await pool.query(`UPDATE users SET status = 'SUSPENDED', is_active = FALSE WHERE id = $1`, [id]);
  }

  // ---------------------------------------------------------
  // 1. REGISTRATION TESTS
  // ---------------------------------------------------------
  console.log('\n[1] Registration & Verification Tests');
  
  // Student
  let res = await request('POST', '/api/auth/register/student', student);
  console.log('Student Registration:', res.status === 201 ? 'PASS' : `FAIL (${res.status}) - ${JSON.stringify(res.data)}`);
  
  // Industry
  res = await request('POST', '/api/auth/register/industry', industry);
  console.log('Industry Registration:', res.status === 201 ? 'PASS' : `FAIL (${res.status}) - ${JSON.stringify(res.data)}`);

  // Placement (starts PENDING_APPROVAL)
  res = await request('POST', '/api/auth/register/placement', placement);
  console.log('Placement Registration:', res.status === 201 ? 'PASS' : `FAIL (${res.status}) - ${JSON.stringify(res.data)}`);

  // Check state before verification
  let sState = await getUserState(student.username);
  let pState = await getUserState(placement.username);
  console.log(`Student Pre-Verify State: status=${sState.status}, verified=${sState.email_verified}`);
  console.log(`Placement Pre-Verify State: status=${pState.status}, verified=${pState.email_verified}`);

  // ---------------------------------------------------------
  // 2. STATE-SPECIFIC LOGIN TESTS (PRE-VERIFICATION)
  // ---------------------------------------------------------
  console.log('\n[2] Login State Matrix');
  clearSession();
  res = await request('POST', '/api/auth/login', { username: student.username, password: student.password });
  console.log(`Login Unverified (Student): Expected 403, Got ${res.status} | Session=${!!sessionCookie}`);

  // ---------------------------------------------------------
  // 3. EMAIL VERIFICATION
  // ---------------------------------------------------------
  console.log('\n[3] Verification Tokens & DB Updates');
  const sToken = await getVerificationToken(student.username);
  res = await request('POST', '/api/auth/verify-email', { token: sToken });
  console.log(`Student Verify Email: Expected 200, Got ${res.status}`);
  
  const pToken = await getVerificationToken(placement.username);
  res = await request('POST', '/api/auth/verify-email', { token: pToken });
  console.log(`Placement Verify Email: Expected 200, Got ${res.status}`);

  sState = await getUserState(student.username);
  pState = await getUserState(placement.username);
  console.log(`Student Post-Verify State: status=${sState.status}, verified=${sState.email_verified}`);
  console.log(`Placement Post-Verify State: status=${pState.status}, verified=${pState.email_verified}`);
  // Assertion: Placement should still be PENDING_APPROVAL

  // ---------------------------------------------------------
  // 4. APPROVAL WORKFLOW
  // ---------------------------------------------------------
  console.log('\n[4] Approval Logic Separation');
  res = await request('POST', '/api/auth/login', { username: placement.username, password: placement.password });
  console.log(`Login Unapproved (Placement): Expected 403, Got ${res.status}`);
  
  await approveUser(placement.username);
  res = await request('POST', '/api/auth/login', { username: placement.username, password: placement.password });
  console.log(`Login Approved (Placement): Expected 200, Got ${res.status} | Session=${!!sessionCookie}`);
  
  // ---------------------------------------------------------
  // 5. ROLE ESCALATION
  // ---------------------------------------------------------
  console.log('\n[5] Role Escalation Audit');
  const plId = await getUserId(placement.username);
  // Attempt to update placement profile with role escalation
  res = await request('PUT', `/api/admin/placement-cell/${plId}`, { name: 'Hacked', role: 'admin' }, true);
  // Wait, the placement cell user cannot call this API directly since they are 'placement', not 'admin'.
  console.log(`Placement calling Admin API: Expected 403, Got ${res.status}`);

  // ---------------------------------------------------------
  // 6. OLD SESSION INVALIDATION (SUSPENSION)
  // ---------------------------------------------------------
  console.log('\n[6] Old Session Invalidation');
  clearSession();
  res = await request('POST', '/api/auth/login', { username: student.username, password: student.password });
  console.log(`Student Login (Active): Expected 200, Got ${res.status}`);
  
  // Make a protected request
  res = await request('GET', '/api/auth/me', null, true);
  console.log(`Protected API (Active): Expected 200, Got ${res.status}`);
  
  // Suspend user
  await suspendUser(student.username);
  
  // Reuse same session
  res = await request('GET', '/api/auth/me', null, true);
  console.log(`Protected API (Suspended - Same Session): Expected 403, Got ${res.status}`);

  // ---------------------------------------------------------
  // 7. LOGOUT & REACTIVATION
  // ---------------------------------------------------------
  console.log('\n[7] Logout & Reactivation');
  await approveUser(student.username); // Reactivate
  res = await request('GET', '/api/auth/me', null, true);
  console.log(`Protected API (Reactivated - Old Session): Expected 401, Got ${res.status} (Session was destroyed)`);
  
  clearSession();
  res = await request('POST', '/api/auth/login', { username: student.username, password: student.password });
  console.log(`Login (Reactivated): Expected 200, Got ${res.status}`);
  
  res = await request('POST', '/api/auth/logout', null, true);
  console.log(`Logout: Expected 200, Got ${res.status}`);
  
  res = await request('GET', '/api/auth/me', null, true);
  console.log(`Protected API (Logged out): Expected 401, Got ${res.status}`);

  // ---------------------------------------------------------
  // 8. IDOR
  // ---------------------------------------------------------
  console.log('\n[8] IDOR Audit (Industry)');
  // Industry 1
  const indToken1 = await getVerificationToken(industry.username);
  await request('POST', '/api/auth/verify-email', { token: indToken1 });
  
  // Industry 2
  const industry2 = { name: 'Test Industry 2', email: `industry2_${ts}@tech.com`, username: `ind2_${ts}`, password: 'password123', companyName: 'TechCorp2', designation: 'HR' };
  await request('POST', '/api/auth/register/industry', industry2);
  const indToken2 = await getVerificationToken(industry2.username);
  await request('POST', '/api/auth/verify-email', { token: indToken2 });
  
  // Login Ind 1
  clearSession();
  await request('POST', '/api/auth/login', { username: industry.username, password: industry.password });
  
  // Create Company Profile for Ind 1
  await request('PUT', '/api/industry/company', { companyName: 'TechCorp', industry: 'IT' }, true);

  // Create Job as Ind 1
  res = await request('POST', '/api/industry/jobs', { title: 'Job 1', location: 'Remote', description: 'desc' }, true);
  const jobId = res.data?.opportunity?.id;
  console.log(`Industry 1 Create Job: Expected 201, Got ${res.status}`);
  
  // Login Ind 2
  clearSession();
  await request('POST', '/api/auth/login', { username: industry2.username, password: industry2.password });
  // Try to update Job 1
  res = await request('PUT', `/api/industry/opportunities/${jobId}`, { title: 'Hacked' }, true);
  console.log(`Industry 2 Edit Job 1 (IDOR): Expected 404/403, Got ${res.status}`);

  console.log('\n--- TESTS COMPLETED ---');
  process.exit(0);
}

runTests().catch(console.error);
