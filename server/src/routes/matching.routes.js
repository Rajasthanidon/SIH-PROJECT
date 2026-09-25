const express = require('express');
const matchingController = require('../controllers/matchingController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole(['student', 'industry', 'admin']));

router.get('/candidate/:candidateId/opportunity/:opportunityId', matchingController.getCandidateOpportunityMatch);
router.get('/opportunity/:opportunityId/candidates', matchingController.getOpportunityCandidateRanking);

module.exports = router;
