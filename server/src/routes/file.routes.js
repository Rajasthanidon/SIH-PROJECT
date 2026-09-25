const express = require('express');
const fileController = require('../controllers/fileController');

const router = express.Router();

// Protected resume download endpoints
router.get('/resumes/:filename', fileController.getResumeFile);
router.get('/resume/:filename', fileController.getResumeFile);

module.exports = router;
