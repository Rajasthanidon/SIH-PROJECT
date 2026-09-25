const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const {
  loginLimiter,
  registrationLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
} = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register/student', registrationLimiter, authController.registerStudent);
router.post('/register/faculty', registrationLimiter, authController.registerFaculty);
router.post('/register/placement', registrationLimiter, authController.registerPlacement);
router.post('/register/industry', registrationLimiter, authController.registerIndustry);
router.post('/verify-email', emailVerificationLimiter, authController.verifyEmail);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/diagnostics', (req, res) => {
  res.json({
    hasSession: !!req.session,
    hasAuthenticatedUser: !!req.session?.user,
    sessionUserId: req.session?.user?.id ?? null,
    sessionUserRole: req.session?.user?.role ?? null,
    isSecure: req.secure,
    protocol: req.protocol,
    xForwardedProto: req.headers['x-forwarded-proto'],
    trustProxy: req.app.get('trust proxy'),
    nodeEnv: process.env.NODE_ENV,
    envJsNodeEnv: require('../config/env').NODE_ENV
  });
});

router.get('/test-login', (req, res) => {
  req.session.user = { id: 999, role: 'student', email: 'test@example.com' };
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});
router.get('/me', requireAuth, authController.currentUser);
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);

module.exports = router;
