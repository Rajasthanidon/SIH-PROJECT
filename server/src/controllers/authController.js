const AppError = require('../utils/AppError');
const authService = require('../services/authService');

async function registerStudent(req, res, next) {
  try {
    const user = await authService.registerStudent(req.body);
    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.', user });
  } catch (error) {
    next(error);
  }
}

async function registerFaculty(req, res, next) {
  try {
    const user = await authService.registerFaculty(req.body);
    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.', user });
  } catch (error) {
    next(error);
  }
}

async function registerPlacement(req, res, next) {
  try {
    const user = await authService.registerPlacement(req.body);
    res.status(201).json({ message: 'Registration successful. Your account is pending administrator approval.', user });
  } catch (error) {
    next(error);
  }
}

async function registerIndustry(req, res, next) {
  try {
    const user = await authService.registerIndustry(req.body);
    res.status(201).json({ message: 'Registration successful. Please verify your email.', user });
  } catch (error) {
    next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    await authService.verifyEmailToken(req.body.token);
    res.status(200).json({ message: 'Email verified successfully.' });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const user = await authService.loginUser(req.body);
    req.session.user = user;
    return res.status(200).json({
      message: 'Login successful.',
      user,
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res) {
  if (req.session) {
    req.session.destroy();
  }

  res.clearCookie('connect.sid');
  return res.status(200).json({ message: 'Logged out successfully.' });
}

async function currentUser(req, res) {
  if (!req.session || !req.session.user) {
    throw new AppError('Session expired or missing.', 401);
  }

  res.status(200).json({
    user: req.session.user,
  });
}

async function forgotPassword(req, res) {
  res.status(200).json({
    message: 'If an account exists, a password reset flow will be sent to the provided email.',
  });
}

module.exports = {
  registerStudent,
  registerFaculty,
  registerPlacement,
  registerIndustry,
  verifyEmail,
  login,
  logout,
  currentUser,
  forgotPassword,
};
