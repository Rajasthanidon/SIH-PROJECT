const adminService = require('../services/adminService');
const auditService = require('../services/auditService');
const masterDataService = require('../services/masterDataService');

async function getStats(req, res, next) {
  try {
    const stats = await adminService.getPlatformStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
}

async function getStudents(req, res, next) {
  try {
    const students = await adminService.getUsersByRole('student');
    res.status(200).json({ students });
  } catch (error) {
    next(error);
  }
}

async function getFaculty(req, res, next) {
  try {
    const faculty = await adminService.getUsersByRole('faculty');
    res.status(200).json({ faculty });
  } catch (error) {
    next(error);
  }
}

async function getIndustry(req, res, next) {
  try {
    const industry = await adminService.getUsersByRole('industry');
    res.status(200).json({ industry });
  } catch (error) {
    next(error);
  }
}

async function getPlacementCell(req, res, next) {
  try {
    const placementCell = await adminService.getUsersByRole('placement');
    res.status(200).json({ placementCell });
  } catch (error) {
    next(error);
  }
}

async function getJobs(req, res, next) {
  try {
    const jobs = await adminService.getAllJobs();
    res.status(200).json({ jobs });
  } catch (error) {
    next(error);
  }
}

async function getInternships(req, res, next) {
  try {
    const internships = await adminService.getAllInternships();
    res.status(200).json({ internships });
  } catch (error) {
    next(error);
  }
}

async function getOpportunityById(req, res, next) {
  try {
    const opportunity = await adminService.getOpportunityById(req.params.id);
    res.status(200).json({ opportunity });
  } catch (error) {
    next(error);
  }
}

async function updateOpportunityStatus(req, res, next) {
  try {
    const { status } = req.body;
    const opportunity = await adminService.updateOpportunityStatus(req.params.id, status);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'OPPORTUNITY_STATUS_CHANGED',
      entityType: 'opportunity',
      entityId: req.params.id,
      metadata: { status: req.body.status }
    });
    res.status(200).json({ opportunity, message: 'Opportunity status updated.' });
  } catch (error) {
    next(error);
  }
}

async function getApplications(req, res, next) {
  try {
    const applications = await adminService.getAllApplications();
    res.status(200).json({ applications });
  } catch (error) {
    next(error);
  }
}

async function getApplicationById(req, res, next) {
  try {
    const application = await adminService.getApplicationById(req.params.id);
    res.status(200).json({ application });
  } catch (error) {
    next(error);
  }
}

async function getAnalyticsOverview(req, res, next) {
  try {
    const analytics = await adminService.getAnalyticsOverview();
    res.status(200).json(analytics);
  } catch (error) {
    next(error);
  }
}

async function createGlobalNotification(req, res, next) {
  try {
    const result = await adminService.createGlobalNotification(req.body);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'ADMIN_NOTIFICATION_CREATED',
      entityType: 'notification_batch',
      entityId: req.session.user.id,
      metadata: { audience: req.body.audience, type: req.body.type }
    });
    res.status(201).json({ message: 'Notifications created', created: result.created });
  } catch (error) {
    next(error);
  }
}

async function getAdminNotificationHistory(req, res, next) {
  try {
    const history = await adminService.getAdminNotificationHistory();
    res.status(200).json({ history });
  } catch (error) {
    next(error);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const { page = 1, limit = 50, action, entityType, actorUserId } = req.query;
    const result = await auditService.getAuditLogs({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      action,
      entityType,
      actorUserId
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// ─── Master Data Handlers ───────────────────────────────────────────────────

async function getDepartments(req, res, next) {
  try {
    // Admin gets all departments (active and inactive)
    const departments = await masterDataService.getDepartments(false);
    res.status(200).json({ departments });
  } catch (error) {
    next(error);
  }
}

async function addDepartment(req, res, next) {
  try {
    if (!req.body.name) {
      return res.status(400).json({ message: 'Department name is required' });
    }
    const dept = await masterDataService.addDepartment(req.body.name);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'MASTER_DATA_CREATED',
      entityType: 'department',
      entityId: dept.id,
      metadata: { name: dept.name }
    });
    
    res.status(201).json({ message: 'Department added.', department: dept });
  } catch (error) {
    next(error);
  }
}

async function updateDepartmentStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }
    const dept = await masterDataService.updateDepartmentStatus(req.params.id, isActive);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: isActive ? 'MASTER_DATA_ACTIVATED' : 'MASTER_DATA_DEACTIVATED',
      entityType: 'department',
      entityId: dept.id,
      metadata: { name: dept.name }
    });
    
    res.status(200).json({ message: 'Department status updated.', department: dept });
  } catch (error) {
    next(error);
  }
}

// ─── Student Admin Handlers ─────────────────────────────────────────────────

async function getStudentById(req, res, next) {
  try {
    const student = await adminService.getStudentById(req.params.id);
    res.status(200).json(student);
  } catch (error) {
    next(error);
  }
}

async function getStudentProfile(req, res, next) {
  try {
    const profileData = await adminService.getStudentFullProfileForAdmin(req.params.id);
    res.status(200).json(profileData);
  } catch (error) {
    next(error);
  }
}

async function createStudent(req, res, next) {
  try {
    const student = await adminService.createStudent(req.body);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'STUDENT_CREATED',
      entityType: 'user',
      entityId: student.id,
      metadata: null
    });
    res.status(201).json({ message: 'Student created successfully.', student });
  } catch (error) {
    next(error);
  }
}

async function updateStudent(req, res, next) {
  try {
    const student = await adminService.updateStudent(req.params.id, req.body);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'STUDENT_UPDATED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Student updated successfully.', student });
  } catch (error) {
    next(error);
  }
}

async function deleteStudent(req, res, next) {
  try {
    await adminService.deleteStudent(req.params.id);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'STUDENT_DEACTIVATED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Student deactivated successfully.' });
  } catch (error) {
    next(error);
  }
}

async function approveStudent(req, res, next) {
  try {
    await adminService.updateUserStatus(req.params.id, 'ACTIVE');
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'STUDENT_APPROVED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Student approved successfully.' });
  } catch (error) {
    next(error);
  }
}

async function rejectStudent(req, res, next) {
  try {
    await adminService.updateUserStatus(req.params.id, 'REJECTED');
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'STUDENT_REJECTED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Student rejected.' });
  } catch (error) {
    next(error);
  }
}

async function suspendStudent(req, res, next) {
  try {
    await adminService.updateUserStatus(req.params.id, 'SUSPENDED');
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'STUDENT_SUSPENDED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Student suspended.' });
  } catch (error) {
    next(error);
  }
}

async function activateStudent(req, res, next) {
  try {
    await adminService.updateUserStatus(req.params.id, 'ACTIVE');
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'STUDENT_ACTIVATED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Student activated.' });
  } catch (error) {
    next(error);
  }
}

async function resendVerification(req, res, next) {
  try {
    await adminService.resendVerification(req.params.id);
    res.status(200).json({ message: 'Verification email resent.' });
  } catch (error) {
    next(error);
  }
}

async function verifyStudentEmail(req, res, next) {
  try {
    await adminService.verifyEmailManual(req.params.id, 'student');
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'STUDENT_EMAIL_VERIFIED_MANUAL',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Student email verified successfully.' });
  } catch (error) { next(error); }
}

async function verifyFacultyEmail(req, res, next) {
  try {
    await adminService.verifyEmailManual(req.params.id, 'faculty');
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'FACULTY_EMAIL_VERIFIED_MANUAL',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Faculty email verified successfully.' });
  } catch (error) { next(error); }
}

async function verifyIndustryEmail(req, res, next) {
  try {
    await adminService.verifyEmailManual(req.params.id, 'industry');
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'INDUSTRY_EMAIL_VERIFIED_MANUAL',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Industry email verified successfully.' });
  } catch (error) { next(error); }
}

async function verifyPlacementEmail(req, res, next) {
  try {
    await adminService.verifyEmailManual(req.params.id, 'placement');
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'PLACEMENT_EMAIL_VERIFIED_MANUAL',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Placement cell email verified successfully.' });
  } catch (error) { next(error); }
}

async function getInternships(req, res, next) {
  try {
    const internships = await adminService.getAllInternships();
    res.status(200).json({ internships });
  } catch (error) {
    next(error);
  }
}

async function getApplications(req, res, next) {
  try {
    const applications = await adminService.getAllApplications();
    res.status(200).json({ applications });
  } catch (error) {
    next(error);
  }
}

async function getApprovalQueue(req, res, next) {
  try {
    const { search = '', emailVerified, department, page = 1, limit = 50 } = req.query;
    const evFilter = emailVerified === 'true' ? true : emailVerified === 'false' ? false : undefined;
    const result = await adminService.getStudentApprovalQueue({
      search,
      emailVerified: evFilter,
      department: department || undefined,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getApprovalStatsController(req, res, next) {
  try {
    const stats = await adminService.getApprovalStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
}

// ─── Faculty Admin Handlers ─────────────────────────────────────────────────

async function getFacultyById(req, res, next) {
  try {
    const faculty = await adminService.getFacultyById(req.params.id);
    res.status(200).json(faculty);
  } catch (error) { next(error); }
}

async function getFacultyStats(req, res, next) {
  try {
    const stats = await adminService.getFacultyStats();
    res.status(200).json(stats);
  } catch (error) { next(error); }
}

async function createFaculty(req, res, next) {
  try {
    const faculty = await adminService.createFaculty(req.body);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'FACULTY_CREATED',
      entityType: 'user',
      entityId: faculty.id,
      metadata: null
    });
    res.status(201).json({ message: 'Faculty created successfully.', faculty });
  } catch (error) { next(error); }
}

async function updateFaculty(req, res, next) {
  try {
    const faculty = await adminService.updateFaculty(req.params.id, req.body);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'FACULTY_UPDATED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Faculty updated.', faculty });
  } catch (error) { next(error); }
}

async function suspendFaculty(req, res, next) {
  try {
    await adminService.updateUserStatus(req.params.id, 'SUSPENDED');
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'FACULTY_SUSPENDED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Faculty suspended.' });
  } catch (error) { next(error); }
}

async function activateFaculty(req, res, next) {
  try {
    await adminService.updateUserStatus(req.params.id, 'ACTIVE');
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'FACULTY_ACTIVATED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Faculty activated.' });
  } catch (error) { next(error); }
}

async function deactivateFaculty(req, res, next) {
  try {
    await adminService.deactivateFaculty(req.params.id);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'FACULTY_DEACTIVATED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Faculty deactivated.' });
  } catch (error) { next(error); }
}

async function resendFacultyVerification(req, res, next) {
  try {
    await adminService.resendVerification(req.params.id);
    res.status(200).json({ message: 'Verification email resent.' });
  } catch (error) { next(error); }
}
// ─── Industry Admin Handlers ────────────────────────────────────────────────

async function getIndustryById(req, res, next) {
  try {
    const industry = await adminService.getIndustryById(req.params.id);
    res.status(200).json(industry);
  } catch (error) { next(error); }
}

async function getIndustryStats(req, res, next) {
  try {
    const stats = await adminService.getIndustryStats();
    res.status(200).json(stats);
  } catch (error) { next(error); }
}

async function createIndustry(req, res, next) {
  try {
    const industry = await adminService.createIndustry(req.body);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'INDUSTRY_CREATED',
      entityType: 'user',
      entityId: industry.id,
      metadata: null
    });
    res.status(201).json({ message: 'Industry created successfully.', industry });
  } catch (error) { next(error); }
}

async function updateIndustry(req, res, next) {
  try {
    const industry = await adminService.updateIndustry(req.params.id, req.body);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'INDUSTRY_UPDATED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Industry updated.', industry });
  } catch (error) { next(error); }
}

async function suspendIndustry(req, res, next) {
  try {
    await adminService.updateUserStatus(req.params.id, 'SUSPENDED');
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'INDUSTRY_SUSPENDED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Industry suspended.' });
  } catch (error) { next(error); }
}

async function activateIndustry(req, res, next) {
  try {
    await adminService.updateUserStatus(req.params.id, 'ACTIVE');
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'INDUSTRY_ACTIVATED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Industry activated.' });
  } catch (error) { next(error); }
}

async function deactivateIndustry(req, res, next) {
  try {
    await adminService.deactivateIndustry(req.params.id);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'INDUSTRY_DEACTIVATED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Industry deactivated.' });
  } catch (error) { next(error); }
}

async function resendIndustryVerification(req, res, next) {
  try {
    await adminService.resendVerification(req.params.id);
    res.status(200).json({ message: 'Verification email resent.' });
  } catch (error) { next(error); }
}

async function getIndustryJobs(req, res, next) {
  try {
    const jobs = await adminService.getIndustryOpportunities(req.params.id, 'JOB');
    res.status(200).json({ jobs });
  } catch (error) { next(error); }
}

async function getIndustryInternships(req, res, next) {
  try {
    const internships = await adminService.getIndustryOpportunities(req.params.id, 'INTERNSHIP');
    res.status(200).json({ internships });
  } catch (error) { next(error); }
}

async function getIndustryApplications(req, res, next) {
  try {
    const applications = await adminService.getIndustryApplications(req.params.id);
    res.status(200).json({ applications });
  } catch (error) { next(error); }
}

// ─── Placement Cell Admin Handlers ──────────────────────────────────────────

async function getPlacementById(req, res, next) {
  try {
    const placement = await adminService.getPlacementById(req.params.id);
    res.status(200).json(placement);
  } catch (error) { next(error); }
}

async function getPlacementStats(req, res, next) {
  try {
    const stats = await adminService.getPlacementStats();
    res.status(200).json(stats);
  } catch (error) { next(error); }
}

async function createPlacement(req, res, next) {
  try {
    const placement = await adminService.createPlacement(req.body);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'PLACEMENT_CELL_CREATED',
      entityType: 'user',
      entityId: placement.id,
      metadata: null
    });
    res.status(201).json({ message: 'Placement Cell member created successfully.', placement });
  } catch (error) { next(error); }
}

async function updatePlacement(req, res, next) {
  try {
    const placement = await adminService.updatePlacement(req.params.id, req.body);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'PLACEMENT_CELL_UPDATED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Placement Cell member updated.', placement });
  } catch (error) { next(error); }
}

async function suspendPlacement(req, res, next) {
  try {
    await adminService.updateUserStatus(req.params.id, 'SUSPENDED');
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'PLACEMENT_CELL_SUSPENDED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Placement Cell member suspended.' });
  } catch (error) { next(error); }
}

async function activatePlacement(req, res, next) {
  try {
    await adminService.updateUserStatus(req.params.id, 'ACTIVE');
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'PLACEMENT_CELL_ACTIVATED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Placement Cell member activated.' });
  } catch (error) { next(error); }
}

async function deactivatePlacement(req, res, next) {
  try {
    await adminService.deactivatePlacement(req.params.id);
    
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: 'PLACEMENT_CELL_DEACTIVATED',
      entityType: 'user',
      entityId: req.params.id,
      metadata: null
    });
    res.status(200).json({ message: 'Placement Cell member deactivated.' });
  } catch (error) { next(error); }
}

async function resendPlacementVerification(req, res, next) {
  try {
    await adminService.resendVerification(req.params.id);
    res.status(200).json({ message: 'Verification email resent.' });
  } catch (error) { next(error); }
}

module.exports = {
  getStats,
  getStudents,
  getFaculty,
  getIndustry,
  getPlacementCell,
  getJobs,
  getInternships,
  getApplications,
  getApplicationById,
  getAnalyticsOverview,
  createGlobalNotification,
  getAdminNotificationHistory,
  getAuditLogs,
  
  getDepartments,
  addDepartment,
  updateDepartmentStatus,

  getOpportunityById,
  updateOpportunityStatus,
  getStudentById,
  getStudentProfile,
  createStudent,
  updateStudent,
  deleteStudent,
  approveStudent,
  rejectStudent,
  suspendStudent,
  activateStudent,
  resendVerification,
  verifyStudentEmail,
  getApprovalQueue,
  getApprovalStats: getApprovalStatsController,
  // Faculty
  getFacultyById,
  getFacultyStats,
  createFaculty,
  updateFaculty,
  suspendFaculty,
  activateFaculty,
  deactivateFaculty,
  resendFacultyVerification,
  // Industry
  getIndustryById,
  getIndustryStats,
  createIndustry,
  updateIndustry,
  suspendIndustry,
  activateIndustry,
  deactivateIndustry,
  resendIndustryVerification,
  getIndustryJobs,
  getIndustryInternships,
  getIndustryApplications,
  // Placement Cell
  getPlacementById,
  getPlacementStats,
  createPlacement,
  updatePlacement,
  suspendPlacement,
  activatePlacement,
  deactivatePlacement,
  resendPlacementVerification,
  verifyFacultyEmail,
  verifyIndustryEmail,
  verifyPlacementEmail
};
