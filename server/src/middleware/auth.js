const { getPool } = require('../config/database');

async function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: {
        code: 'SESSION_EXPIRED',
        message: 'Authentication required. Your session may have expired.',
        details: [],
      },
    });
  }

  try {
    const pool = getPool();
    if (pool) {
      const userRes = await pool.query('SELECT status, is_active FROM users WHERE id = $1', [req.session.user.id]);
      const dbUser = userRes.rows[0];

      if (!dbUser) {
        req.session.destroy();
        return res.status(401).json({
          error: { code: 'USER_NOT_FOUND', message: 'User account no longer exists.' }
        });
      }

      if (!dbUser.is_active || dbUser.status === 'SUSPENDED' || dbUser.status === 'REJECTED') {
        req.session.destroy();
        return res.status(403).json({
          error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended or is inactive.' }
        });
      }
    }
  } catch (err) {
    return next(err);
  }

  return next();
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Authentication required. Your session may have expired.',
          details: [],
        },
      });
    }

    const userRole = req.session.user.role || 'guest';

    if (!allowedRoles.length || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource.',
        details: [],
      },
    });
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
