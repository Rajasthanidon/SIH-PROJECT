/**
 * In-memory sliding window rate limiter middleware for sensitive endpoints.
 * Zero external dependencies, safe memory management with periodic cleanup.
 */

const isProduction = process.env.NODE_ENV === 'production';
const isBypassEnabled = process.env.RATE_LIMIT_BYPASS === 'true';

if (!isProduction && isBypassEnabled) {
  console.warn("WARNING: Authentication rate limiting bypass enabled for non-production environment.");
}

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 15, message = 'Too many requests. Please try again later.' } = {}) {
  const store = new Map();

  // Periodic cleanup every 5 minutes to prevent memory leaks
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now - record.resetTime > windowMs) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Unref interval so it does not keep node process alive in tests
  if (interval.unref) interval.unref();

  return function rateLimiter(req, res, next) {
    // In test environment, skip unless explicitly testing rate limiter
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    // QA/Development bypass
    if (!isProduction && isBypassEnabled) {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let record = store.get(ip);
    if (!record || (now > record.resetTime)) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(ip, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message,
          retryAfterSeconds: retryAfterSec,
        },
      });
    }

    next();
  };
}

// Sensible pre-configured limiters for sensitive endpoints
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts. Please wait a few minutes before trying again.',
});

const registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 25,
  message: 'Too many account registrations from this network. Please try again later.',
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many password reset requests. Please try again later.',
});

const emailVerificationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many verification attempts. Please try again later.',
});

module.exports = {
  createRateLimiter,
  loginLimiter,
  registrationLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
};
