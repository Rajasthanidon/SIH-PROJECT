const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');

const ROLE_NAMES = ['student', 'faculty', 'placement', 'industry', 'admin'];
const roleSeed = ROLE_NAMES.map((role, index) => ({ id: index + 1, name: role }));

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

function getRoleDefinitions() {
  return roleSeed;
}

function assertDatabaseReady() {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database connection is not configured. Set DATABASE_URL and run npm run migrate.');
  }
  return pool;
}

async function ensureRoles() {
  const pool = assertDatabaseReady();
  const existingRoles = await pool.query('SELECT name FROM roles');
  const existingNames = new Set(existingRoles.rows.map((row) => row.name));
  const missingRoles = ROLE_NAMES.filter((role) => !existingNames.has(role));

  if (missingRoles.length > 0) {
    throw new Error(`Required roles are missing. Run npm run seed or restore the database. Missing: ${missingRoles.join(', ')}`);
  }

  return getRoleDefinitions();
}

async function createUser({ name, email, password, role, username, enrollmentNumber, registrationNumber, department, companyName, designation, status, emailVerified }) {
  const normalizedRole = normalizeRole(role);
  const safeEmail = String(email || '').trim().toLowerCase();
  const safeUsername = String(username || safeEmail.split('@')[0]).trim();

  if (!ROLE_NAMES.includes(normalizedRole)) {
    const error = new Error('Unsupported role.');
    error.statusCode = 400;
    throw error;
  }

  const pool = assertDatabaseReady();

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (
        name, email, password_hash, role, is_active, username, 
        enrollment_number, registration_number, department, company_name, designation, status, email_verified,
        created_at, updated_at
      )
       VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING *`,
      [
        String(name || '').trim(), 
        safeEmail, 
        passwordHash, 
        normalizedRole, 
        safeUsername,
        enrollmentNumber || null,
        registrationNumber || null,
        department || null,
        companyName || null,
        designation || null,
        status || 'ACTIVE',
        emailVerified || false
      ],
    );

    return result.rows[0];
  } catch (error) {
    if (error?.code === '23505') {
      const constraint = error.constraint || '';
      let message = 'An account already exists with this information.';
      if (constraint.includes('email')) message = 'An account already exists for this email.';
      if (constraint.includes('username')) message = 'Username already exists.';
      if (constraint.includes('enrollment_number')) message = 'An account already exists for this enrollment number.';
      if (constraint.includes('registration_number')) message = 'An account already exists for this registration number.';
      
      const duplicateError = new Error(message);
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }
}

async function findUserByUsernameOrEmail(identifier) {
  const pool = assertDatabaseReady();
  const safeId = String(identifier || '').trim().toLowerCase();

  const result = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1', [safeId]);
  return result.rows[0] || null;
}

async function findUserByEmail(email) {
  const pool = assertDatabaseReady();
  const safeEmail = String(email || '').trim().toLowerCase();

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [safeEmail]);
  return result.rows[0] || null;
}

async function findUserById(id) {
  const pool = assertDatabaseReady();
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

async function updateLastLogin(userId) {
  const pool = assertDatabaseReady();
  const result = await pool.query(
    'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *',
    [userId],
  );

  return result.rows[0] || null;
}

module.exports = {
  ROLE_NAMES,
  ensureRoles,
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsernameOrEmail,
  comparePassword,
  updateLastLogin,
  normalizeRole,
};
