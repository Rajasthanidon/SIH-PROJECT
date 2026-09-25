const { getPool } = require('../config/database');
const { getStudentProfile } = require('../repositories/student.repository');
const authService = require('./authService');
const bcrypt = require('bcryptjs');

async function getPlatformStats() {
  const pool = getPool();
  
  const res = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
      (SELECT COUNT(*) FROM users WHERE role = 'student' AND status IN ('PENDING_APPROVAL', 'PENDING_VERIFICATION')) as pending_students,
      (SELECT COUNT(*) FROM users WHERE role = 'faculty') as total_faculty,
      (SELECT COUNT(*) FROM users WHERE role = 'industry') as total_industry,
      (SELECT COUNT(*) FROM users WHERE role = 'placement') as total_placement_cell,
      (SELECT COUNT(*) FROM opportunities WHERE type = 'JOB') as total_jobs,
      (SELECT COUNT(*) FROM opportunities WHERE type = 'INTERNSHIP') as total_internships,
      (SELECT COUNT(*) FROM applications) as total_applications
  `);

  const row = res.rows[0];

  return {
    totalStudents: parseInt(row.total_students || 0, 10),
    pendingStudents: parseInt(row.pending_students || 0, 10),
    totalFaculty: parseInt(row.total_faculty || 0, 10),
    totalIndustry: parseInt(row.total_industry || 0, 10),
    totalPlacementCell: parseInt(row.total_placement_cell || 0, 10),
    totalJobs: parseInt(row.total_jobs || 0, 10),
    totalInternships: parseInt(row.total_internships || 0, 10),
    totalApplications: parseInt(row.total_applications || 0, 10),
  };
}

async function getAnalyticsOverview() {
  const pool = getPool();
  
  const [
    platformStats,
    studentStatusRes,
    studentDeptRes,
    oppStatusRes,
    appStatusRes,
    appTypeRes
  ] = await Promise.all([
    getPlatformStats(),
    pool.query(`
      SELECT status, is_active, COUNT(*) as count 
      FROM users 
      WHERE role = 'student' 
      GROUP BY status, is_active
    `),
    pool.query(`
      SELECT department, COUNT(*) as count 
      FROM users 
      WHERE role = 'student' 
      GROUP BY department 
      ORDER BY count DESC
    `),
    pool.query(`
      SELECT type, status, COUNT(*) as count 
      FROM opportunities 
      GROUP BY type, status
    `),
    pool.query(`
      SELECT status, COUNT(*) as count 
      FROM applications 
      GROUP BY status
    `),
    pool.query(`
      SELECT o.type, COUNT(a.id) as count
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      GROUP BY o.type
    `)
  ]);

  return {
    overview: platformStats,
    students: {
      statusDistribution: studentStatusRes.rows.map(r => ({ ...r, count: parseInt(r.count, 10) })),
      departmentDistribution: studentDeptRes.rows.map(r => ({ department: r.department || 'Not Specified', count: parseInt(r.count, 10) }))
    },
    opportunities: {
      distribution: oppStatusRes.rows.map(r => ({ ...r, count: parseInt(r.count, 10) }))
    },
    applications: {
      statusDistribution: appStatusRes.rows.map(r => ({ status: r.status, count: parseInt(r.count, 10) })),
      typeDistribution: appTypeRes.rows.map(r => ({ type: r.type, count: parseInt(r.count, 10) }))
    }
  };
}

async function getUsersByRole(role) {
  const pool = getPool();
  const query = `
    SELECT id, name, email, role, is_active, status, email_verified, created_at, enrollment_number, registration_number, department, username 
    FROM users 
    WHERE role = $1 
    ORDER BY created_at DESC
  `;
  const res = await pool.query(query, [role]);
  return res.rows;
}

async function getStudentById(id) {
  const pool = getPool();
  const userQuery = `
    SELECT id, name, email, role, is_active, status, email_verified, created_at, enrollment_number, registration_number, department, username 
    FROM users 
    WHERE id = $1 AND role = 'student'
  `;
  const userRes = await pool.query(userQuery, [id]);
  if (!userRes.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Student not found.', 404);
  }
  
  const user = userRes.rows[0];
  const profile = await getStudentProfile(id);
  
  return { ...user, profile };
}

async function getStudentFullProfileForAdmin(studentId) {
  const pool = getPool();
  
  // 1. Get identity
  const userQuery = `
    SELECT id, name, email, role, is_active, status, email_verified, created_at, enrollment_number, registration_number, department, username 
    FROM users 
    WHERE id = $1 AND role = 'student'
  `;
  const userRes = await pool.query(userQuery, [studentId]);
  if (!userRes.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Student not found.', 404);
  }
  const identity = userRes.rows[0];

  // 2. Get profile + completion via existing studentService
  const studentService = require('./studentService');
  const profileData = await studentService.getStudentProfile(studentId);

  // 3. Get applications using existing repository data structure
  const appsQuery = `
    SELECT a.id, a.status, a.created_at, o.title as opportunity_title, o.type as opportunity_type, o.company_name
    FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    WHERE a.student_id = $1
    ORDER BY a.created_at DESC
  `;
  const appsRes = await pool.query(appsQuery, [studentId]);

  return {
    identity,
    profile: profileData,
    applications: appsRes.rows
  };
}

async function createStudent(payload) {
  // Reuse existing registration logic
  return authService.registerStudent(payload);
}

async function updateStudent(id, payload) {
  const pool = getPool();
  const { name, email, username, enrollmentNumber, registrationNumber, department } = payload;
  
  const query = `
    UPDATE users 
    SET name = COALESCE($1, name), 
        email = COALESCE($2, email), 
        username = COALESCE($3, username),
        enrollment_number = COALESCE($4, enrollment_number),
        registration_number = COALESCE($5, registration_number),
        department = COALESCE($6, department)
    WHERE id = $7 AND role = 'student'
    RETURNING id, name, email, role, is_active, status, email_verified, created_at, enrollment_number, registration_number, department, username
  `;
  
  const res = await pool.query(query, [name, email, username, enrollmentNumber, registrationNumber, department, id]);
  if (!res.rows[0]) throw new Error('Student not found');
  return res.rows[0];
}

async function getStudentApprovalQueue({ search = '', emailVerified, department, page = 1, limit = 50 } = {}) {
  const pool = getPool();

  const conditions = [`role = 'student'`, `status IN ('PENDING_APPROVAL', 'PENDING_VERIFICATION')`];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    const idx = values.length;
    conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx} OR enrollment_number ILIKE $${idx} OR registration_number ILIKE $${idx})`);
  }
  if (emailVerified === true)  { conditions.push(`email_verified = TRUE`); }
  if (emailVerified === false) { conditions.push(`email_verified = FALSE`); }
  if (department) {
    values.push(department);
    conditions.push(`department = $${values.length}`);
  }

  const offset = (page - 1) * limit;
  values.push(limit, offset);

  const query = `
    SELECT id, name, email, role, is_active, status, email_verified,
           created_at, enrollment_number, registration_number, department, username
    FROM users
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at ASC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `;

  const countQuery = `SELECT COUNT(*) FROM users WHERE ${conditions.slice(0, conditions.length).join(' AND ')} AND role = 'student' AND status IN ('PENDING_APPROVAL', 'PENDING_VERIFICATION')`;

  const [res, countRes] = await Promise.all([
    pool.query(query, values),
    pool.query(`SELECT COUNT(*) FROM users WHERE ${conditions.join(' AND ')}`, values.slice(0, values.length - 2))
  ]);

  return {
    students: res.rows,
    total: parseInt(countRes.rows[0].count, 10),
    page,
    limit
  };
}

async function getApprovalStats() {
  const pool = getPool();
  const [pending, verifiedPending, unverifiedPending, recentlyApproved] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM users WHERE role='student' AND status IN ('PENDING_APPROVAL', 'PENDING_VERIFICATION')"),
    pool.query("SELECT COUNT(*) FROM users WHERE role='student' AND status IN ('PENDING_APPROVAL', 'PENDING_VERIFICATION') AND email_verified=TRUE"),
    pool.query("SELECT COUNT(*) FROM users WHERE role='student' AND status IN ('PENDING_APPROVAL', 'PENDING_VERIFICATION') AND email_verified=FALSE"),
    pool.query("SELECT COUNT(*) FROM users WHERE role='student' AND status='ACTIVE' AND updated_at > NOW() - INTERVAL '7 days'")
  ]);
  return {
    pending: parseInt(pending.rows[0].count, 10),
    verifiedPending: parseInt(verifiedPending.rows[0].count, 10),
    unverifiedPending: parseInt(unverifiedPending.rows[0].count, 10),
    recentlyApproved: parseInt(recentlyApproved.rows[0].count, 10)
  };
}

function validateStatusTransition(currentStatus, targetStatus) {
  const AppError = require('../utils/AppError');
  const validTransitions = {
    PENDING_APPROVAL:     ['ACTIVE', 'REJECTED'],
    // Faculty & industry have no PENDING_APPROVAL step; admin can activate or suspend them
    PENDING_VERIFICATION: ['ACTIVE', 'SUSPENDED'],
    ACTIVE:               ['SUSPENDED'],
    SUSPENDED:            ['ACTIVE'],
    REJECTED:             []                       // terminal — no re-review path
  };
  const allowed = validTransitions[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new AppError(
      `Cannot change status from '${currentStatus}' to '${targetStatus}'. Allowed transitions: ${allowed.join(', ') || 'none'}.`,
      400
    );
  }
}

async function deleteStudent(id) {
  const pool = getPool();
  await pool.query(`UPDATE users SET is_active = FALSE, status = 'SUSPENDED' WHERE id = $1 AND role = 'student'`, [id]);
}

async function updateUserStatus(id, status) {
  const pool = getPool();

  // Fetch current status for transition validation
  const current = await pool.query('SELECT status FROM users WHERE id = $1', [id]);
  if (!current.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('User not found.', 404);
  }
  validateStatusTransition(current.rows[0].status, status);

  let isActive = true;
  if (status === 'SUSPENDED' || status === 'REJECTED') {
    isActive = false;
  }
  await pool.query(`UPDATE users SET status = $1, is_active = $2, updated_at = NOW() WHERE id = $3`, [status, isActive, id]);
}

async function verifyEmailManual(id) {
  const pool = getPool();
  const userRes = await pool.query(`SELECT status, role, email_verified FROM users WHERE id = $1`, [id]);
  
  if (!userRes.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('User not found.', 404);
  }
  
  if (userRes.rows[0].email_verified) {
    const AppError = require('../utils/AppError');
    throw new AppError('Email is already verified.', 400);
  }
  
  await pool.query(`UPDATE users SET email_verified = TRUE WHERE id = $1`, [id]);
  
  if (userRes.rows[0].status === 'PENDING_VERIFICATION') {
    const role = userRes.rows[0].role;
    const nextStatus = role === 'student' ? 'PENDING_APPROVAL' : 'ACTIVE';
    const isActive = nextStatus === 'ACTIVE';
    await pool.query(`UPDATE users SET status = $2, is_active = $3 WHERE id = $1`, [id, nextStatus, isActive]);
  }
  
  await pool.query(`DELETE FROM email_verifications WHERE user_id = $1`, [id]);
}

async function resendVerification(id) {
  // Remove old token and create new
  const pool = getPool();
  await pool.query(`DELETE FROM email_verifications WHERE user_id = $1`, [id]);
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  await pool.query(
    `INSERT INTO email_verifications (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
    [id, token]
  );
}

async function getAllJobs() {
  const pool = getPool();
  const query = `
    SELECT o.*, u.name as company_name_user
    FROM opportunities o
    JOIN users u ON o.industry_id = u.id
    WHERE o.type = 'JOB'
    ORDER BY o.created_at DESC
  `;
  const res = await pool.query(query);
  return res.rows;
}

async function getAllInternships() {
  const pool = getPool();
  const query = `
    SELECT o.*, u.name as company_name_user
    FROM opportunities o
    JOIN users u ON o.industry_id = u.id
    WHERE o.type = 'INTERNSHIP'
    ORDER BY o.created_at DESC
  `;
  const res = await pool.query(query);
  return res.rows;
}

async function getAllApplications() {
  const pool = getPool();
  const query = `
    SELECT a.*, o.title as opportunity_title, o.type as opportunity_type, o.company_name, u.name as student_name, u.email as student_email
    FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    JOIN users u ON a.student_id = u.id
    ORDER BY a.created_at DESC
  `;
  const res = await pool.query(query);
  return res.rows;
}

async function getApplicationById(id) {
  const pool = getPool();
  const query = `
    SELECT a.*, 
           o.title as opportunity_title, 
           o.type as opportunity_type, 
           o.company_name,
           u.name as student_name, 
           u.email as student_email
    FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    JOIN users u ON a.student_id = u.id
    WHERE a.id = $1
  `;
  const res = await pool.query(query, [id]);
  if (!res.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Application not found.', 404);
  }
  return res.rows[0];
}

async function getOpportunityById(id) {
  const pool = getPool();
  const query = `
    SELECT o.*, u.name as company_name_user, u.email as industry_email
    FROM opportunities o
    JOIN users u ON o.industry_id = u.id
    WHERE o.id = $1
  `;
  const res = await pool.query(query, [id]);
  if (!res.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Opportunity not found.', 404);
  }
  
  // Also fetch application count
  const countQuery = `SELECT COUNT(*) as count FROM applications WHERE opportunity_id = $1`;
  const countRes = await pool.query(countQuery, [id]);
  
  return {
    ...res.rows[0],
    applicationCount: parseInt(countRes.rows[0].count, 10)
  };
}

async function updateOpportunityStatus(id, status) {
  const allowed = ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'EXPIRED'];
  if (!allowed.includes(status)) {
    const AppError = require('../utils/AppError');
    throw new AppError('Invalid status.', 400);
  }
  
  const pool = getPool();
  
  // Verify exists
  const check = await pool.query('SELECT id FROM opportunities WHERE id = $1', [id]);
  if (!check.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Opportunity not found.', 404);
  }
  
  const result = await pool.query(
    'UPDATE opportunities SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
}

// ─── Faculty-specific admin service functions ───────────────────────────────

async function getFacultyById(id) {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, name, email, role, is_active, status, email_verified, created_at, department, designation, username
     FROM users WHERE id = $1 AND role = 'faculty'`,
    [id]
  );
  if (!res.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Faculty member not found.', 404);
  }
  return res.rows[0];
}

async function createFaculty(payload) {
  // Reuse existing registration — preserves hashing, unique constraints, email verification token
  return authService.registerFaculty(payload);
}

async function updateFaculty(id, payload) {
  const pool = getPool();
  // Only allow non-sensitive fields; role/password/tokens are excluded
  const { name, email, username, department, designation } = payload;
  const res = await pool.query(
    `UPDATE users
     SET name        = COALESCE($1, name),
         email       = COALESCE($2, email),
         username    = COALESCE($3, username),
         department  = COALESCE($4, department),
         designation = COALESCE($5, designation),
         updated_at  = NOW()
     WHERE id = $6 AND role = 'faculty'
     RETURNING id, name, email, role, is_active, status, email_verified, created_at, department, designation, username`,
    [name || null, email || null, username || null, department || null, designation || null, id]
  );
  if (!res.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Faculty member not found.', 404);
  }
  return res.rows[0];
}

async function deactivateFaculty(id) {
  // Soft-deactivate — sets SUSPENDED + is_active = false, preserves all data
  const pool = getPool();
  const current = await pool.query('SELECT status FROM users WHERE id = $1 AND role = $2', [id, 'faculty']);
  if (!current.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Faculty member not found.', 404);
  }
  await pool.query(
    `UPDATE users SET status = 'SUSPENDED', is_active = FALSE, updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

async function getFacultyStats() {
  const pool = getPool();
  const [total, active, unverified, suspended] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'faculty'"),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'faculty' AND status = 'ACTIVE'"),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'faculty' AND email_verified = FALSE"),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'faculty' AND status = 'SUSPENDED'")
  ]);
  return {
    total: parseInt(total.rows[0].count, 10),
    active: parseInt(active.rows[0].count, 10),
    unverified: parseInt(unverified.rows[0].count, 10),
    suspended: parseInt(suspended.rows[0].count, 10)
  };
}

// ─── Industry-specific admin service functions ───────────────────────────────

async function getIndustryById(id) {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, name, email, role, is_active, status, email_verified, created_at, company_name, designation, username
     FROM users WHERE id = $1 AND role = 'industry'`,
    [id]
  );
  if (!res.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Industry member not found.', 404);
  }
  return res.rows[0];
}

async function createIndustry(payload) {
  const authService = require('./authService');
  return authService.registerIndustry(payload);
}

async function updateIndustry(id, payload) {
  const pool = getPool();
  const { name, email, username, companyName, designation } = payload;
  const res = await pool.query(
    `UPDATE users
     SET name         = COALESCE($1, name),
         email        = COALESCE($2, email),
         username     = COALESCE($3, username),
         company_name = COALESCE($4, company_name),
         designation  = COALESCE($5, designation),
         updated_at   = NOW()
     WHERE id = $6 AND role = 'industry'
     RETURNING id, name, email, role, is_active, status, email_verified, created_at, company_name, designation, username`,
    [name || null, email || null, username || null, companyName || null, designation || null, id]
  );
  if (!res.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Industry member not found.', 404);
  }
  return res.rows[0];
}

async function deactivateIndustry(id) {
  const pool = getPool();
  const current = await pool.query('SELECT status FROM users WHERE id = $1 AND role = $2', [id, 'industry']);
  if (!current.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Industry member not found.', 404);
  }
  await pool.query(
    `UPDATE users SET status = 'SUSPENDED', is_active = FALSE, updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

async function getIndustryStats() {
  const pool = getPool();
  const [total, active, unverified, suspended] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'industry'"),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'industry' AND status = 'ACTIVE'"),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'industry' AND email_verified = FALSE"),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'industry' AND status = 'SUSPENDED'")
  ]);
  return {
    total: parseInt(total.rows[0].count, 10),
    active: parseInt(active.rows[0].count, 10),
    unverified: parseInt(unverified.rows[0].count, 10),
    suspended: parseInt(suspended.rows[0].count, 10)
  };
}

async function getIndustryOpportunities(industryId, type = null) {
  const pool = getPool();
  let query = `
    SELECT o.*, u.name as company_name_user
    FROM opportunities o
    JOIN users u ON o.industry_id = u.id
    WHERE o.industry_id = $1
  `;
  const params = [industryId];
  if (type) {
    query += ` AND o.type = $2`;
    params.push(type);
  }
  query += ` ORDER BY o.created_at DESC`;
  const res = await pool.query(query, params);
  return res.rows;
}

async function getIndustryApplications(industryId) {
  const pool = getPool();
  const query = `
    SELECT a.*, o.title as opportunity_title, o.type as opportunity_type, o.company_name, u.name as student_name, u.email as student_email, u.enrollment_number as student_enrollment_number
    FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    JOIN users u ON a.student_id = u.id
    WHERE o.industry_id = $1
    ORDER BY a.created_at DESC
  `;
  const res = await pool.query(query, [industryId]);
  return res.rows;
}
// ─── Placement Cell Admin Functions ─────────────────────────────────────────

async function getPlacementById(id) {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, name, email, role, is_active, status, email_verified, created_at, designation, username
     FROM users WHERE id = $1 AND role = 'placement'`,
    [id]
  );
  if (!res.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Placement Cell member not found.', 404);
  }
  return res.rows[0];
}

async function createPlacement(payload) {
  const authService = require('./authService');
  return authService.registerPlacement(payload);
}

async function updatePlacement(id, payload) {
  const pool = getPool();
  const { name, email, username, designation } = payload;
  const res = await pool.query(
    `UPDATE users
     SET name        = COALESCE($1, name),
         email       = COALESCE($2, email),
         username    = COALESCE($3, username),
         designation = COALESCE($4, designation),
         updated_at  = NOW()
     WHERE id = $5 AND role = 'placement'
     RETURNING id, name, email, role, is_active, status, email_verified, created_at, designation, username`,
    [name || null, email || null, username || null, designation || null, id]
  );
  if (!res.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Placement Cell member not found.', 404);
  }
  return res.rows[0];
}

async function deactivatePlacement(id) {
  const pool = getPool();
  const current = await pool.query('SELECT status FROM users WHERE id = $1 AND role = $2', [id, 'placement']);
  if (!current.rows[0]) {
    const AppError = require('../utils/AppError');
    throw new AppError('Placement Cell member not found.', 404);
  }
  await pool.query(
    `UPDATE users SET status = 'SUSPENDED', is_active = FALSE, updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

async function getPlacementStats() {
  const pool = getPool();
  const [total, active, pendingApproval, suspended] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'placement'"),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'placement' AND status = 'ACTIVE'"),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'placement' AND status = 'PENDING_APPROVAL'"),
    pool.query("SELECT COUNT(*) FROM users WHERE role = 'placement' AND status = 'SUSPENDED'")
  ]);
  return {
    total: parseInt(total.rows[0].count, 10),
    active: parseInt(active.rows[0].count, 10),
    pendingApproval: parseInt(pendingApproval.rows[0].count, 10),
    suspended: parseInt(suspended.rows[0].count, 10)
  };
}

async function createGlobalNotification(payload) {
  const { title, message, type, audience } = payload;
  const pool = getPool();
  
  if (!title || !message || !type || !audience) {
    const AppError = require('../utils/AppError');
    throw new AppError('Title, message, type, and audience are required', 400);
  }

  let userCondition = '';
  const queryParams = [title, message, type];
  
  if (audience === 'ALL') {
    userCondition = `1=1`; // all users
  } else if (['student', 'faculty', 'industry', 'placement'].includes(audience)) {
    userCondition = `role = $4`;
    queryParams.push(audience);
  } else {
    const AppError = require('../utils/AppError');
    throw new AppError('Invalid audience', 400);
  }

  // Use a pure SQL INSERT ... SELECT for efficient bulk insertion without N+1 or moving data to Node
  const query = `
    INSERT INTO notifications (user_id, title, message, type)
    SELECT id, $1, $2, $3 FROM users WHERE ${userCondition} AND is_active = TRUE
    RETURNING id
  `;
  
  const res = await pool.query(query, queryParams);
  return { created: res.rowCount };
}

async function getAdminNotificationHistory() {
  const pool = getPool();
  // We can derive history by grouping identical notifications by title, message, and type
  const query = `
    SELECT title, message, type, MIN(created_at) as created_at, COUNT(user_id) as recipient_count
    FROM notifications
    WHERE type = 'ADMIN_ANNOUNCEMENT' OR type LIKE 'GLOBAL_%'
    GROUP BY title, message, type
    ORDER BY MIN(created_at) DESC
    LIMIT 100
  `;
  const res = await pool.query(query);
  return res.rows;
}

module.exports = {
  getPlatformStats,
  getUsersByRole,
  getAllJobs,
  getAllInternships,
  getAllApplications,
  getStudentById,
  getStudentFullProfileForAdmin,
  createStudent,
  updateStudent,
  deleteStudent,
  updateUserStatus,
  verifyEmailManual,
  resendVerification,
  getStudentApprovalQueue,
  getApprovalStats,
  // Faculty
  getFacultyById,
  createFaculty,
  updateFaculty,
  deactivateFaculty,
  getFacultyStats,
  // Industry
  getIndustryById,
  createIndustry,
  updateIndustry,
  deactivateIndustry,
  getIndustryStats,
  getIndustryOpportunities,
  getIndustryApplications,
  // Placement Cell
  getPlacementById,
  createPlacement,
  updatePlacement,
  deactivatePlacement,
  getPlacementStats,
  getOpportunityById,
  updateOpportunityStatus,
  getApplicationById,
  getAnalyticsOverview,
  createGlobalNotification,
  getAdminNotificationHistory
};
