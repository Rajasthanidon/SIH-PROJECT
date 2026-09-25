const { getPool } = require('../config/database');

/**
 * Logs an administrative action safely.
 * Does not throw on error to prevent breaking business workflows if audit fails.
 */
async function logAdminAction({ actorUserId, action, entityType, entityId, metadata = null }) {
  if (!actorUserId || !action || !entityType || !entityId) {
    console.error('Audit log failed: missing required fields', { actorUserId, action, entityType, entityId });
    return false;
  }

  try {
    const pool = getPool();
    const query = `
      INSERT INTO admin_audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await pool.query(query, [actorUserId, action, entityType, entityId, metadata]);
    return true;
  } catch (error) {
    console.error('Audit log failed to write to database:', error);
    // Returning false instead of throwing allows the main business mutation to succeed
    // Even if logging fails, avoiding silent failures where users think the action succeeded
    return false;
  }
}

/**
 * Retrieves audit logs for the Admin view.
 */
async function getAuditLogs({ page = 1, limit = 50, action, entityType, actorUserId } = {}) {
  const pool = getPool();
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  
  if (action) {
    params.push(action);
    conditions.push(`a.action = $${params.length}`);
  }
  if (entityType) {
    params.push(entityType);
    conditions.push(`a.entity_type = $${params.length}`);
  }
  if (actorUserId) {
    params.push(actorUserId);
    conditions.push(`a.actor_user_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM admin_audit_logs a ${whereClause}`;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const query = `
    SELECT a.id, a.actor_user_id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
           u.name as actor_name, u.email as actor_email
    FROM admin_audit_logs a
    JOIN users u ON a.actor_user_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  
  const res = await pool.query(query, [...params, limit, offset]);

  return {
    logs: res.rows,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

module.exports = {
  logAdminAction,
  getAuditLogs
};
