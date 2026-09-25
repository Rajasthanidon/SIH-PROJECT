const AppError = require('../utils/AppError');
const { createUser, findUserByEmail, findUserByUsernameOrEmail, comparePassword, updateLastLogin, ensureRoles } = require('../repositories/user.repository');
const { getPool } = require('../config/database');
const { validateLoginInput, validateRegistrationInput } = require('../utils/validators');

async function registerStudent(payload) {
  const { name, email, password, username, enrollmentNumber, registrationNumber, department } = payload;
  
  if (!name) throw new AppError('Name is required.', 400);
  if (!email) throw new AppError('Email is required.', 400);
  if (!password || password.length < 8) throw new AppError('Password must be at least 8 characters long.', 400);
  if (!username) throw new AppError('Username is required.', 400);
  if (!enrollmentNumber) throw new AppError('Enrollment number is required.', 400);
  if (!registrationNumber) throw new AppError('Registration number is required.', 400);
  if (!department) throw new AppError('Department is required.', 400);

  if (!email.endsWith('@nita.ug.ac.in')) {
    throw new AppError('Only @nita.ug.ac.in email addresses are allowed for student registration.', 400);
  }

  const user = await createUser({
    name, email, password, username, enrollmentNumber, registrationNumber, department,
    role: 'student', status: 'PENDING_VERIFICATION', emailVerified: false
  });
  
  await createVerificationToken(user.id);
  return sanitizeUser(user);
}

async function registerFaculty(payload) {
  const { name, email, password, username, department, designation } = payload;
  
  if (!name || !email || !password || !username || !department || !designation) {
    throw new AppError('All fields are required.', 400);
  }

  const user = await createUser({
    name, email, password, username, department, designation,
    role: 'faculty', status: 'PENDING_VERIFICATION', emailVerified: false
  });
  
  await createVerificationToken(user.id);
  return sanitizeUser(user);
}

async function registerPlacement(payload) {
  const { name, email, password, username, designation } = payload;
  
  if (!name || !email || !password || !username || !designation) {
    throw new AppError('All fields are required.', 400);
  }

  const user = await createUser({
    name, email, password, username, designation,
    role: 'placement', status: 'PENDING_APPROVAL', emailVerified: false
  });
  
  await createVerificationToken(user.id);
  return sanitizeUser(user);
}

async function registerIndustry(payload) {
  const { name, email, password, username, companyName, designation } = payload;
  
  if (!name || !email || !password || !username || !companyName || !designation) {
    throw new AppError('All fields are required.', 400);
  }

  const user = await createUser({
    name, email, password, username, companyName, designation,
    role: 'industry', status: 'PENDING_VERIFICATION', emailVerified: false
  });
  
  await createVerificationToken(user.id);
  return sanitizeUser(user);
}

async function createVerificationToken(userId) {
  // In a real app, generate cryptographically secure token and send email
  // Here we just create a mock token in the DB for demonstration of flow
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const pool = getPool();
  await pool.query(
    `INSERT INTO email_verifications (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
    [userId, token]
  );
}

async function verifyEmailToken(token) {
  const pool = getPool();
  const res = await pool.query(
    `SELECT user_id FROM email_verifications WHERE token_hash = $1 AND expires_at > NOW()`,
    [token]
  );
  if (!res.rows[0]) throw new AppError('Invalid or expired verification token.', 400);

  const userId = res.rows[0].user_id;

  await pool.query(`UPDATE users SET email_verified = TRUE WHERE id = $1`, [userId]);

  const userRes = await pool.query(`SELECT role, status FROM users WHERE id = $1`, [userId]);
  if (userRes.rows[0] && userRes.rows[0].status === 'PENDING_VERIFICATION') {
    const role = userRes.rows[0].role;
    const nextStatus = role === 'student' ? 'PENDING_APPROVAL' : 'ACTIVE';
    const isActive = nextStatus === 'ACTIVE';
    await pool.query(`UPDATE users SET status = $2, is_active = $3 WHERE id = $1`, [userId, nextStatus, isActive]);
  }

  await pool.query(`DELETE FROM email_verifications WHERE user_id = $1`, [userId]);
  
  return true;
}

async function loginUser(payload) {
  const { username, password } = payload;
  if (!username || !password) {
    throw new AppError('Username and password are required.', 400);
  }

  const user = await findUserByUsernameOrEmail(username);
  if (!user) {
    throw new AppError('Invalid username or password.', 401);
  }

  const passwordMatches = await comparePassword(password, user.passwordHash || user.password_hash);
  if (!passwordMatches) {
    throw new AppError('Invalid username or password.', 401);
  }

  if (!user.email_verified) {
    throw new AppError('Your email address has not been verified.', 403);
  }

  if (user.status === 'PENDING_APPROVAL') {
    throw new AppError('This account is awaiting administrator approval.', 403);
  }
  
  if (user.status === 'SUSPENDED') {
    throw new AppError('This account has been suspended.', 403);
  }

  const updatedUser = await updateLastLogin(user.id);
  const sessionUser = sanitizeUser(updatedUser || user);
  return sessionUser;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profilePhoto: user.profile_photo || user.profilePhoto || null,
    role: user.role || user.role_name,
    isActive: user.is_active ?? user.isActive,
    createdAt: user.created_at || user.createdAt,
    updatedAt: user.updated_at || user.updatedAt,
    lastLoginAt: user.last_login_at || user.lastLoginAt,
  };
}

module.exports = {
  registerStudent,
  registerFaculty,
  registerPlacement,
  registerIndustry,
  verifyEmailToken,
  loginUser,
  sanitizeUser,
};
