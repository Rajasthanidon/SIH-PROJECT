const dotenv = require('dotenv');

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const DEFAULT_SECRETS = new Set([
  'development-secret-change-me',
  'development-session-secret-change-me',
  'change_this_in_production',
  '',
]);

function parseCommaList(value, fallback = []) {
  const entries = String(value || '').split(',').map((entry) => entry.trim()).filter(Boolean);
  return entries.length ? entries : fallback;
}

function getRequiredSecret(name, fallback) {
  const configured = process.env[name];
  const value = configured && configured.trim() ? configured.trim() : fallback;

  if (NODE_ENV === 'production' && (!configured || DEFAULT_SECRETS.has(value))) {
    throw new Error(`Missing or insecure production value for ${name}. Set a strong secret in the environment.`);
  }

  return value;
}

const CLIENT_ORIGINS = parseCommaList(process.env.CLIENT_ORIGIN, ['http://localhost:5173']);
const PUBLIC_REGISTRATION_ROLES = parseCommaList(process.env.PUBLIC_REGISTRATION_ROLES, [
  'student',
  'faculty',
  'placement',
  'industry',
]);

if (NODE_ENV === 'production' && !process.env.CLIENT_ORIGIN) {
  throw new Error('CLIENT_ORIGIN must be configured in production.');
}

if (NODE_ENV === 'production' && process.env.SESSION_COOKIE_SECURE !== 'true') {
  throw new Error('SESSION_COOKIE_SECURE must be true in production.');
}

module.exports = {
  NODE_ENV,
  PORT: Number(process.env.PORT) || 4000,
  CLIENT_ORIGIN: CLIENT_ORIGINS[0],
  CLIENT_ORIGINS: CLIENT_ORIGINS,
  DATABASE_URL: process.env.DATABASE_URL || '',
  DATABASE_SSL: process.env.DATABASE_SSL === 'true',
  JWT_SECRET: getRequiredSecret('JWT_SECRET', 'development-secret-change-me'),
  SESSION_SECRET: getRequiredSecret('SESSION_SECRET', 'development-session-secret-change-me'),
  SESSION_COOKIE_SECURE: process.env.SESSION_COOKIE_SECURE === 'true',
  SESSION_MAX_AGE: Number(process.env.SESSION_MAX_AGE) || 1000 * 60 * 60 * 8,
  PUBLIC_REGISTRATION_ROLES: PUBLIC_REGISTRATION_ROLES,
  ALLOW_ADMIN_REGISTRATION: process.env.ALLOW_ADMIN_REGISTRATION === 'true',
};
