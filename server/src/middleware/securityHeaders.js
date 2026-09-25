/**
 * Production Security Headers Middleware
 * Protects against MIME sniffing, clickjacking, insecure transports, and info leaks.
 */

function securityHeaders(req, res, next) {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking / frame embedding
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Modern referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Modern browsers: disable obsolete buggy XSS auditor
  res.setHeader('X-XSS-Protection', '0');

  // Strict Transport Security (HSTS) when in production or on HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Remove Express fingerprint header
  res.removeHeader('X-Powered-By');

  next();
}

module.exports = securityHeaders;
