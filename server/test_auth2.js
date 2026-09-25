const authService = require('./src/services/authService');
const { getPool } = require('./src/config/database');

async function test() {
  try {
    const student = await authService.registerStudent({
      name: 'Test Student 2',
      email: 'test2@nita.ug.ac.in',
      password: 'password123',
      username: 'teststudent2',
      enrollmentNumber: '25UEE101',
      registrationNumber: 'REG101',
      department: 'EE'
    });
    console.log('Student registered:', student.email);

    // Verify email manually in DB
    const pool = getPool();
    await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [student.id]);
    console.log('Manually verified email in DB');

    const login = await authService.loginUser({
      username: 'teststudent2',
      password: 'password123'
    });
    console.log('Student logged in successfully!', login.username || login.email);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test().then(() => process.exit(0));
