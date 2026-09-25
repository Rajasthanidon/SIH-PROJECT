const express = require('express');
const industryController = require('../controllers/industryController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole(['industry', 'admin']));

router.get('/dashboard', industryController.getIndustryDashboard);
router.get('/company', industryController.getCompanyProfile);
router.put('/company', industryController.upsertCompanyProfile);
router.get('/opportunities', industryController.listOpportunities);
router.post('/jobs', industryController.createJob);
router.post('/internships', industryController.createInternship);
router.post('/projects', industryController.createProject);
router.get('/opportunities/:id', industryController.listOpportunities);
router.put('/opportunities/:id', industryController.updateOpportunity);
router.patch('/opportunities/:id/publish', industryController.publishOpportunity);
router.patch('/opportunities/:id/close', industryController.closeOpportunity);
router.get('/candidates', industryController.searchCandidates);
router.get('/candidates/:candidateId', industryController.getCandidateScorecard);
router.post('/shortlists', industryController.createShortlist);
router.get('/applications', industryController.listApplications);
router.post('/applications/:id/feedback', industryController.addFeedback);

module.exports = router;
