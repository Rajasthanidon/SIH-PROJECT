const { getPool } = require('../config/database');

async function getDepartments(onlyActive = true) {
  const pool = getPool();
  const query = onlyActive 
    ? 'SELECT id, name, is_active FROM departments WHERE is_active = TRUE ORDER BY name ASC'
    : 'SELECT id, name, is_active FROM departments ORDER BY name ASC';
  const res = await pool.query(query);
  return res.rows;
}

async function addDepartment(name) {
  const pool = getPool();
  try {
    const res = await pool.query(
      'INSERT INTO departments (name) VALUES ($1) RETURNING id, name, is_active',
      [name]
    );
    return res.rows[0];
  } catch (error) {
    if (error.code === '23505') { // unique violation
      throw new Error('Department already exists');
    }
    throw error;
  }
}

async function updateDepartmentStatus(id, isActive) {
  const pool = getPool();
  const res = await pool.query(
    'UPDATE departments SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, is_active',
    [isActive, id]
  );
  if (!res.rows[0]) throw new Error('Department not found');
  return res.rows[0];
}

module.exports = {
  getDepartments,
  addDepartment,
  updateDepartmentStatus
};
