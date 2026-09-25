const express = require('express');
const assessmentController = require('../controllers/assessmentController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole(['student']));router.get('/skills', assessmentController.listSkills);
router.get('/skills/:skillName/topics', assessmentController.getSkillTopics);router.get('/roles', assessmentController.listTargetRoles);
router.get('/roles/:roleName', assessmentController.getTargetRoleDetails);
router.post('/start', assessmentController.startAssessment);
router.post('/generate', assessmentController.generateAssessment);
router.get('/leaderboard', assessmentController.getLeaderboard);
router.get('/rank', assessmentController.getCurrentRank);
router.get('/history', assessmentController.getAssessmentHistory);
router.post('/:assessmentId/submit', assessmentController.submitAssessment);
router.get('/:assessmentId/result', assessmentController.getAssessmentResult);

module.exports = router;
