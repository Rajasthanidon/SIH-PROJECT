const { testDatabaseConnection } = require('./src/config/database');
const studentService = require('./src/services/studentService');
require('./src/config/env');

async function measure() {
  const conn = await testDatabaseConnection();
  if (!conn.connected) {
    console.error('DB not connected');
    process.exit(1);
  }

  // Warmup
  try {
    await studentService.getStudentProfile(1);
  } catch(e) {}

  let t0 = performance.now();
  for (let i = 0; i < 100; i++) await studentService.getStudentProfile(1);
  let t1 = performance.now();
  console.log(`getStudentProfile (100x): ${Math.round(t1 - t0)}ms (Avg: ${(t1 - t0)/100}ms)`);
  
  process.exit(0);
}

measure();
