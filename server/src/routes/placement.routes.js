const express = require('express');
const placementController = require('../controllers/placementController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole(['placement', 'admin']));

router.get('/dashboard', placementController.getPlacementDashboard);
router.get('/students', placementController.getPlacementStudents);
router.post('/students/import', placementController.importPlacementStudents);
router.get('/recruiters', placementController.getPlacementRecruiters);
router.get('/drives', placementController.getPlacementDrives);
router.get('/opportunities', placementController.getPlacementOpportunities);
router.get('/applications', placementController.getPlacementApplications);
router.get('/shortlists', placementController.getPlacementShortlists);
router.get('/tracking', placementController.getPlacementTracking);
router.get('/analytics', placementController.getPlacementAnalytics);
router.get('/reports', placementController.getPlacementReports);

module.exports = router;
