const http = require('http');

const API_BASE = 'http://localhost:4000/api';

function request(method, path, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + (url.search || ''),
      method: method,
      headers: {
        'Content-Type': 'application/json',
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
        const duration = performance.now() - start;
        const setCookie = res.headers['set-cookie'] || [];
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: resData,
          size: Buffer.byteLength(resData),
          durationMs: duration,
          cookie: setCookie[0] ? setCookie[0].split(';')[0] : null,
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function benchmark() {
  console.log('=== PHASE 20 BENCHMARK: MEASURING ENDPOINTS ===\n');

  // 1. Login
  const loginRes = await request('POST', '/auth/login', {
    username: 'student1790345650939',
    password: 'password123',
  });
  console.log(`Login response: ${loginRes.status} in ${loginRes.durationMs.toFixed(2)}ms`);
  const sessionCookie = loginRes.cookie;
  if (!sessionCookie) {
    console.error('Login failed to get cookie:', loginRes.data);
    return;
  }

  const endpoints = [
    { name: 'Student Profile', path: '/student/profile' },
    { name: 'Student Dashboard', path: '/student/dashboard' },
    { name: 'Student Skills', path: '/student/skills' },
    { name: 'Student Education', path: '/student/education' },
    { name: 'Student Projects', path: '/student/projects' },
    { name: 'Student Internships', path: '/student/internships' },
    { name: 'Active Opportunities', path: '/opportunities/active' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Skill Gap', path: '/student/skill-gap' },
  ];

  // Warmup run
  for (const ep of endpoints) {
    await request('GET', ep.path, null, sessionCookie);
  }

  // Measure 5 iterations each
  console.log('\n--- Endpoint Latency & Payload Measurements (Averages over 5 runs) ---');
  for (const ep of endpoints) {
    const times = [];
    let size = 0;
    let status = 0;
    for (let i = 0; i < 5; i++) {
      const res = await request('GET', ep.path, null, sessionCookie);
      times.push(res.durationMs);
      size = res.size;
      status = res.status;
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    console.log(`${ep.name.padEnd(22)} | Status: ${status} | Payload: ${size} B | Avg: ${avg.toFixed(2)}ms | Min: ${min.toFixed(2)}ms | Max: ${max.toFixed(2)}ms`);
  }
}

benchmark().catch(console.error);
