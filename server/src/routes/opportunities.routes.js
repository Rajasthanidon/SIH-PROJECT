const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const placementController = require('../controllers/placement.controller');

// Opportunity Routes
router.post('/opportunities', auth.requireAuth, placementController.createOpportunity);
router.get('/opportunities/industry', auth.requireAuth, placementController.getIndustryOpportunities);
router.patch('/opportunities/:id/status', auth.requireAuth, placementController.updateOpportunityStatus);
router.get('/opportunities/active', auth.requireAuth, placementController.getActiveOpportunities);
router.get('/opportunities/:id', auth.requireAuth, placementController.getOpportunityDetails);

// Application Routes
router.post('/opportunities/:id/apply', auth.requireAuth, placementController.applyForOpportunity);
router.get('/applications/student', auth.requireAuth, placementController.getStudentApplications);
router.get('/opportunities/:id/applications', auth.requireAuth, placementController.getOpportunityApplications);
router.patch('/opportunities/:oppId/applications/:appId/status', auth.requireAuth, placementController.updateApplicationStatus);

// Notification Routes
router.get('/notifications', auth.requireAuth, placementController.getNotifications);
router.patch('/notifications/:id/read', auth.requireAuth, placementController.markNotificationRead);

module.exports = router;
