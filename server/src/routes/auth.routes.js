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

router.get('/me', requireAuth, authController.currentUser);
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);

module.exports = router;
