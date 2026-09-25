const env = require('../config/env');

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function validateRegistrationInput({ name, email, password, confirmPassword, role }) {
  const trimmedName = String(name || '').trim();
  const trimmedEmail = String(email || '').trim();
  const trimmedRole = String(role || '').trim().toLowerCase();
  const passwordValue = String(password ?? '');
  const trimmedConfirmPassword = String(confirmPassword ?? passwordValue).trim();

  if (!trimmedName || trimmedName.length < 2) {
    const error = new Error('Name must be at least 2 characters long.');
    error.statusCode = 400;
    throw error;
  }

  if (!isValidEmail(trimmedEmail)) {
    const error = new Error('A valid email address is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!password || String(password).length < 8) {
    const error = new Error('Password must be at least 8 characters long.');
    error.statusCode = 400;
    throw error;
  }

  if (confirmPassword !== undefined && trimmedConfirmPassword.length > 0 && passwordValue !== trimmedConfirmPassword) {
    const error = new Error('Passwords do not match. Please re-enter your password carefully.');
    error.statusCode = 400;
    throw error;
  }

  if (confirmPassword === undefined && passwordValue !== trimmedConfirmPassword) {
    const error = new Error('Passwords do not match. Please re-enter your password carefully.');
    error.statusCode = 400;
    throw error;
  }

  const validRoles = ['student', 'faculty', 'placement', 'industry', 'admin'];
  const publicRoles = new Set(env.PUBLIC_REGISTRATION_ROLES || []);

  if (!validRoles.includes(trimmedRole)) {
    const error = new Error('Unsupported role provided.');
    error.statusCode = 400;
    throw error;
  }

  if (trimmedRole === 'admin' && !env.ALLOW_ADMIN_REGISTRATION) {
    const error = new Error('Admin role registration is disabled. Please create admin accounts through a secure server-side workflow.');
    error.statusCode = 400;
    throw error;
  }

  if (!publicRoles.has(trimmedRole)) {
    const error = new Error(`Role '${trimmedRole}' is not enabled for public registration.`);
    error.statusCode = 400;
    throw error;
  }

  return {
    name: trimmedName,
    email: trimmedEmail.toLowerCase(),
    password: String(password),
    confirmPassword: trimmedConfirmPassword,
    role: trimmedRole,
  };
}

function validateLoginInput({ email, password }) {
  const trimmedEmail = String(email || '').trim();

  if (!isValidEmail(trimmedEmail)) {
    const error = new Error('A valid email address is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!password || String(password).length < 8) {
    const error = new Error('Password must be at least 8 characters long.');
    error.statusCode = 400;
    throw error;
  }

  return {
    email: trimmedEmail.toLowerCase(),
    password: String(password),
  };
}

module.exports = {
  validateRegistrationInput,
  validateLoginInput,
};
