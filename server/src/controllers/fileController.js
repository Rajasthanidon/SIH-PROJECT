const path = require('path');
const fs = require('fs');
const { getPool } = require('../config/database');

const RESUMES_DIR = path.resolve(__dirname, '../../uploads/resumes');

async function getResumeFile(req, res) {
  const rawFilename = req.params.filename;

  // 1. Path traversal & filename sanitization
  if (!rawFilename || typeof rawFilename !== 'string') {
    return res.status(400).json({ error: { code: 'INVALID_FILENAME', message: 'Filename is required.' } });
  }

  const filename = path.basename(rawFilename);
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename) || filename.includes('..')) {
    return res.status(400).json({ error: { code: 'INVALID_FILENAME', message: 'Invalid file name.' } });
  }

  // 2. Ensure file exists on disk
  const filePath = path.join(RESUMES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: { code: 'FILE_NOT_FOUND', message: 'Resume file not found.' } });
  }

  // 3. Authentication required
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required to access private documents.' }
    });
  }

  const user = req.session.user;

  // 4. Authorization check
  const pool = getPool();
  if (!pool) {
    return res.status(500).json({ error: { code: 'DATABASE_ERROR', message: 'Database connection unavailable.' } });
  }

  try {
    const ownerRes = await pool.query(
      `SELECT user_id FROM student_profiles WHERE resume_file_url LIKE $1`,
      [`%${filename}`]
    );

    const ownerId = ownerRes.rows[0]?.user_id;

    // Platform authorities allowed
    if (['admin', 'placement', 'faculty'].includes(user.role)) {
      return sendProtectedFile(res, filePath, filename);
    }

    // Student owner allowed
    if (user.role === 'student') {
      if (ownerId && Number(user.id) === Number(ownerId)) {
        return sendProtectedFile(res, filePath, filename);
      }
      return res.status(403).json({
        error: { code: 'ACCESS_DENIED', message: 'You are not authorized to view another student’s resume.' }
      });
    }

    // Industry recruiter: only allowed if student applied to recruiter's opportunity
    if (user.role === 'industry') {
      if (!ownerId) {
        return res.status(403).json({
          error: { code: 'ACCESS_DENIED', message: 'Resume ownership could not be verified.' }
        });
      }

      const applicationCheck = await pool.query(
        `SELECT 1 FROM applications a
         JOIN opportunities o ON a.opportunity_id = o.id
         WHERE a.student_id = $1 AND o.industry_id = $2
         LIMIT 1`,
        [Number(ownerId), Number(user.id)]
      );

      if (applicationCheck.rowCount > 0) {
        return sendProtectedFile(res, filePath, filename);
      }

      return res.status(403).json({
        error: { code: 'ACCESS_DENIED', message: 'Recruiters can only access resumes of candidates who applied to their postings.' }
      });
    }

    return res.status(403).json({
      error: { code: 'ACCESS_DENIED', message: 'Insufficient permissions to view this document.' }
    });
  } catch (error) {
    console.error('[FILE_AUTH] Error verifying file access:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error verifying document access.' } });
  }
}

function sendProtectedFile(res, filePath, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.sendFile(filePath);
}

module.exports = {
  getResumeFile,
};
