const express = require('express');
const facultyController = require('../controllers/facultyController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole(['faculty', 'admin']));

router.get('/dashboard', facultyController.getFacultyDashboard);
router.get('/students', facultyController.getFacultyStudents);
router.get('/students/:userId/profile', facultyController.getFacultyStudentProfile);
router.get('/analytics', facultyController.getFacultyAnalytics);
router.get('/mentorship', facultyController.getFacultyMentorship);
router.get('/training', facultyController.getFacultyTrainingRecommendations);
router.get('/workshops', facultyController.getFacultyWorkshops);
router.get('/collaboration', facultyController.getFacultyIndustryCollaboration);
router.get('/skill-trends', facultyController.getFacultyIndustrySkillTrends);

module.exports = router;
