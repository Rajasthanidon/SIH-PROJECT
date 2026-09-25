const express = require('express');
const studentController = require('../controllers/studentController');
const skillGapController = require('../controllers/skillGapController');
const matchingController = require('../controllers/matchingController');
const upload = require('../middleware/upload');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole(['student']));

router.get('/dashboard', studentController.getStudentDashboard);
router.get('/skill-gap', skillGapController.getSkillGapAnalysis);
router.get('/recommendations', matchingController.getStudentRecommendations);
router.get('/profile', studentController.getStudentProfile);
router.put('/profile', studentController.updateStudentProfile);
router.post('/profile/photo', upload.single('profilePhoto'), studentController.uploadProfilePhoto);
router.post('/profile/resume', upload.single('resumeFile'), studentController.uploadResume);
router.get('/skills', studentController.getStudentSkills);
router.put('/skills', studentController.updateStudentSkills);
router.get('/topics', studentController.getStudentTopics);
router.put('/topics', studentController.updateStudentTopics);
router.get('/education', studentController.getStudentEducation);
router.post('/education', studentController.createStudentEducation);
router.put('/education/:educationId', studentController.updateStudentEducation);
router.delete('/education/:educationId', studentController.deleteStudentEducation);
router.get('/projects', studentController.getStudentProjects);
router.post('/projects', studentController.createStudentProject);
router.put('/projects/:projectId', studentController.updateStudentProject);
router.delete('/projects/:projectId', studentController.deleteStudentProject);
router.post('/projects/:projectId/submit', studentController.submitStudentProject);
router.get('/internships', studentController.getStudentInternships);
router.post('/internships', studentController.createStudentInternship);
router.put('/internships/:internshipId', studentController.updateStudentInternship);
router.delete('/internships/:internshipId', studentController.deleteStudentInternship);
router.post('/internships/:internshipId/submit', studentController.submitStudentInternship);
router.get('/certifications', studentController.getStudentCertifications);
router.post('/certifications', studentController.createStudentCertification);
router.get('/portfolio', studentController.getStudentPortfolio);

module.exports = router;
