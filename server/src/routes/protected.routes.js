const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/student/profile', requireAuth, requireRole(['student']), (req, res) => {
  res.status(200).json({
    message: 'Student profile access granted.',
    user: req.session.user,
  });
});

router.get('/faculty/students', requireAuth, requireRole(['faculty', 'admin']), (req, res) => {
  res.status(200).json({
    message: 'Faculty student list access granted.',
    user: req.session.user,
  });
});

router.get('/placement/records', requireAuth, requireRole(['placement', 'admin']), (req, res) => {
  res.status(200).json({
    message: 'Placement records access granted.',
    user: req.session.user,
  });
});

router.get('/industry/opportunities', requireAuth, requireRole(['industry', 'admin']), (req, res) => {
  res.status(200).json({
    message: 'Industry opportunity access granted.',
    user: req.session.user,
  });
});

router.get('/admin/users', requireAuth, requireRole(['admin']), (req, res) => {
  res.status(200).json({
    message: 'Admin user management access granted.',
    user: req.session.user,
  });
});

module.exports = router;
