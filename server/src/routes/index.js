const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const assessmentRoutes = require('./assessment.routes');
const industryRoutes = require('./industry.routes');
const facultyRoutes = require('./faculty.routes');
const placementRoutes = require('./placement.routes');
const matchingRoutes = require('./matching.routes');
const protectedRoutes = require('./protected.routes');
const opportunitiesRoutes = require('./opportunities.routes');
const adminRoutes = require('./admin.routes');
const fileRoutes = require('./file.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/student', studentRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/industry', industryRoutes);
router.use('/faculty', facultyRoutes);
router.use('/placement', placementRoutes);
router.use('/matching', matchingRoutes);
router.use('/files', fileRoutes);
router.use('/', opportunitiesRoutes);
router.use('/', protectedRoutes);
router.use('/admin', adminRoutes);

router.get('/ping', (req, res) => {
  res.json({
    message: 'Academia-Industry Portal API is reachable.',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
