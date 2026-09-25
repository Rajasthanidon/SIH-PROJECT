const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Nirdosh Meena\\Desktop\\vs code\\server\\src\\controllers\\adminController.js';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("const auditService = require('../services/auditService');")) {
  content = content.replace(
    "const adminService = require('../services/adminService');",
    "const adminService = require('../services/adminService');\nconst auditService = require('../services/auditService');"
  );
}

// Helper to inject audit log
function injectLog(fnName, actionName, entityType, idParam, metadataObj) {
  const regex = new RegExp(`(async function ${fnName}\\(req, res, next\\) \\{\\s+try \\{[\\s\\S]*?res\\.status\\(\\d+\\)\\.json\\(\\{[\\s\\S]*?\\}\\);)`, 'g');
  content = content.replace(regex, (match) => {
    if (match.includes('auditService.logAdminAction')) return match; // Already injected
    const logCall = `
    await auditService.logAdminAction({
      actorUserId: req.session.user.id,
      action: '${actionName}',
      entityType: '${entityType}',
      entityId: ${idParam},
      metadata: ${metadataObj}
    });
`;
    // Insert before res.status
    return match.replace(/res\.status\(/, logCall + '    res.status(');
  });
}

// Apply injections
injectLog('createStudent', 'STUDENT_CREATED', 'user', 'student.id', 'null');
injectLog('updateStudent', 'STUDENT_UPDATED', 'user', 'req.params.id', 'null');
injectLog('deleteStudent', 'STUDENT_DEACTIVATED', 'user', 'req.params.id', 'null');
injectLog('approveStudent', 'STUDENT_APPROVED', 'user', 'req.params.id', 'null');
injectLog('rejectStudent', 'STUDENT_REJECTED', 'user', 'req.params.id', 'null');
injectLog('suspendStudent', 'STUDENT_SUSPENDED', 'user', 'req.params.id', 'null');
injectLog('activateStudent', 'STUDENT_ACTIVATED', 'user', 'req.params.id', 'null');

injectLog('createFaculty', 'FACULTY_CREATED', 'user', 'faculty.id', 'null');
injectLog('updateFaculty', 'FACULTY_UPDATED', 'user', 'req.params.id', 'null');
injectLog('suspendFaculty', 'FACULTY_SUSPENDED', 'user', 'req.params.id', 'null');
injectLog('activateFaculty', 'FACULTY_ACTIVATED', 'user', 'req.params.id', 'null');
injectLog('deactivateFaculty', 'FACULTY_DEACTIVATED', 'user', 'req.params.id', 'null');

injectLog('createIndustry', 'INDUSTRY_CREATED', 'user', 'industry.id', 'null');
injectLog('updateIndustry', 'INDUSTRY_UPDATED', 'user', 'req.params.id', 'null');
injectLog('suspendIndustry', 'INDUSTRY_SUSPENDED', 'user', 'req.params.id', 'null');
injectLog('activateIndustry', 'INDUSTRY_ACTIVATED', 'user', 'req.params.id', 'null');
injectLog('deactivateIndustry', 'INDUSTRY_DEACTIVATED', 'user', 'req.params.id', 'null');

injectLog('createPlacement', 'PLACEMENT_CELL_CREATED', 'user', 'placement.id', 'null');
injectLog('updatePlacement', 'PLACEMENT_CELL_UPDATED', 'user', 'req.params.id', 'null');
injectLog('suspendPlacement', 'PLACEMENT_CELL_SUSPENDED', 'user', 'req.params.id', 'null');
injectLog('activatePlacement', 'PLACEMENT_CELL_ACTIVATED', 'user', 'req.params.id', 'null');
injectLog('deactivatePlacement', 'PLACEMENT_CELL_DEACTIVATED', 'user', 'req.params.id', 'null');

injectLog('updateOpportunityStatus', 'OPPORTUNITY_STATUS_CHANGED', 'opportunity', 'req.params.id', '{ status: req.body.status }');
injectLog('createGlobalNotification', 'ADMIN_NOTIFICATION_CREATED', 'notification_batch', 'req.session.user.id', '{ audience: req.body.audience, type: req.body.type }');


fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully injected audit logs');
