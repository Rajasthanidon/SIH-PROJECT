const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole(['admin']));

router.get('/stats', adminController.getStats);

// Approval queue (must be before :id routes to avoid param conflict)
router.get('/approvals/queue', adminController.getApprovalQueue);
router.get('/approvals/stats', adminController.getApprovalStats);

router.get('/students', adminController.getStudents);
router.get('/students/:id', adminController.getStudentById);
router.get('/students/:id/profile', adminController.getStudentProfile);
router.post('/students', adminController.createStudent);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.patch('/students/:id/approve', adminController.approveStudent);
router.patch('/students/:id/reject', adminController.rejectStudent);
router.patch('/students/:id/suspend', adminController.suspendStudent);
router.patch('/students/:id/activate', adminController.activateStudent);
router.post('/students/:id/resend-verification', adminController.resendVerification);
router.post('/students/:id/verify-email', adminController.verifyStudentEmail);

router.get('/faculty', adminController.getFaculty);
router.get('/faculty/stats', adminController.getFacultyStats);
router.get('/faculty/:id', adminController.getFacultyById);
router.post('/faculty', adminController.createFaculty);
router.put('/faculty/:id', adminController.updateFaculty);
router.patch('/faculty/:id/suspend', adminController.suspendFaculty);
router.patch('/faculty/:id/activate', adminController.activateFaculty);
router.delete('/faculty/:id', adminController.deactivateFaculty);
router.post('/faculty/:id/resend-verification', adminController.resendFacultyVerification);

router.get('/industry', adminController.getIndustry);
router.get('/industry/stats', adminController.getIndustryStats);
router.get('/industry/:id', adminController.getIndustryById);
router.post('/industry', adminController.createIndustry);
router.put('/industry/:id', adminController.updateIndustry);
router.patch('/industry/:id/suspend', adminController.suspendIndustry);
router.patch('/industry/:id/activate', adminController.activateIndustry);
router.delete('/industry/:id', adminController.deactivateIndustry);
router.post('/industry/:id/resend-verification', adminController.resendIndustryVerification);
router.get('/industry/:id/jobs', adminController.getIndustryJobs);
router.get('/industry/:id/internships', adminController.getIndustryInternships);
router.get('/industry/:id/applications', adminController.getIndustryApplications);
router.get('/placement-cell', adminController.getPlacementCell);
router.get('/placement-cell/stats', adminController.getPlacementStats);
router.get('/placement-cell/:id', adminController.getPlacementById);
router.post('/placement-cell', adminController.createPlacement);
router.put('/placement-cell/:id', adminController.updatePlacement);
router.patch('/placement-cell/:id/suspend', adminController.suspendPlacement);
router.patch('/placement-cell/:id/activate', adminController.activatePlacement);
router.delete('/placement-cell/:id', adminController.deactivatePlacement);
router.post('/placement-cell/:id/resend-verification', adminController.resendPlacementVerification);
router.get('/jobs', adminController.getJobs);
router.get('/internships', adminController.getInternships);
router.get('/opportunities/:id', adminController.getOpportunityById);
router.patch('/opportunities/:id/status', adminController.updateOpportunityStatus);
router.get('/applications', adminController.getApplications);
router.get('/applications/:id', adminController.getApplicationById);
router.get('/analytics/overview', adminController.getAnalyticsOverview);
router.post('/notifications', adminController.createGlobalNotification);
router.get('/notifications', adminController.getAdminNotificationHistory);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/master-data/departments', adminController.getDepartments);
router.post('/master-data/departments', adminController.addDepartment);
router.patch('/master-data/departments/:id/status', adminController.updateDepartmentStatus);

module.exports = router;
