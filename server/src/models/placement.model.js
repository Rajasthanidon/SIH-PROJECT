const db = require('../config/database').getPool();

class Opportunity {
  static async create(data) {
    const {
      industry_id, type, title, company_name, description, responsibilities,
      required_skills, preferred_qualifications, internship_duration, stipend,
      ppo_available, salary, employment_type, location, work_mode,
      application_deadline, openings, min_cgpa, allowed_branches,
      batch_eligibility, experience_requirement, additional_requirements, status
    } = data;

    const result = await db.query(
      `INSERT INTO opportunities (
        industry_id, type, title, company_name, description, responsibilities,
        required_skills, preferred_qualifications, internship_duration, stipend,
        ppo_available, salary, employment_type, location, work_mode,
        application_deadline, openings, min_cgpa, allowed_branches,
        batch_eligibility, experience_requirement, additional_requirements, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *`,
      [
        industry_id, type, title, company_name, description, responsibilities,
        JSON.stringify(required_skills || []), preferred_qualifications, internship_duration, stipend,
        ppo_available || false, salary, employment_type, location, work_mode,
        application_deadline || null, openings || null, min_cgpa || null, JSON.stringify(allowed_branches || []),
        JSON.stringify(batch_eligibility || []), experience_requirement, additional_requirements, status || 'DRAFT'
      ]
    );
    return result.rows[0];
  }

  static async updateStatus(id, industry_id, status) {
    const result = await db.query(
      `UPDATE opportunities SET status = $1, updated_at = NOW() WHERE id = $2 AND industry_id = $3 RETURNING *`,
      [status, id, industry_id]
    );
    return result.rows[0];
  }

  static async update(id, industry_id, data) {
    // Basic update logic, omitted for brevity; usually one updates specific fields or all
    const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'industry_id' && k !== 'created_at' && k !== 'updated_at');
    if (keys.length === 0) return null;
    
    let query = 'UPDATE opportunities SET ';
    const values = [];
    let i = 1;
    for (const key of keys) {
      query += `${key} = $${i}, `;
      let val = data[key];
      if (Array.isArray(val) || typeof val === 'object') val = JSON.stringify(val);
      values.push(val);
      i++;
    }
    query += `updated_at = NOW() WHERE id = $${i} AND industry_id = $${i+1} RETURNING *`;
    values.push(id, industry_id);
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(`SELECT * FROM opportunities WHERE id = $1`, [id]);
    return result.rows[0];
  }

  static async findByIndustry(industry_id) {
    const result = await db.query(
      `SELECT * FROM opportunities WHERE industry_id = $1 ORDER BY created_at DESC`,
      [industry_id]
    );
    return result.rows;
  }

  static async findActive() {
    const result = await db.query(
      `SELECT id, industry_id, type, title, company_name, description,
              salary, stipend, employment_type, location, work_mode,
              application_deadline, openings, min_cgpa, status, created_at
       FROM opportunities 
       WHERE status IN ('PUBLISHED', 'ACTIVE') 
       AND (application_deadline IS NULL OR application_deadline > NOW()) 
       ORDER BY created_at DESC`
    );
    return result.rows;
  }
}

class Application {
  static async apply(opportunity_id, student_id, profile_snapshot) {
    const result = await db.query(
      `INSERT INTO applications (opportunity_id, student_id, profile_snapshot)
       VALUES ($1, $2, $3) RETURNING *`,
      [opportunity_id, student_id, JSON.stringify(profile_snapshot)]
    );
    return result.rows[0];
  }

  static async hasApplied(opportunity_id, student_id) {
    const result = await db.query(
      `SELECT 1 FROM applications WHERE opportunity_id = $1 AND student_id = $2`,
      [opportunity_id, student_id]
    );
    return result.rowCount > 0;
  }

  static async findByStudent(student_id) {
    const result = await db.query(
      `SELECT a.*, o.title, o.company_name, o.type, o.location 
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       WHERE a.student_id = $1
       ORDER BY a.created_at DESC`,
      [student_id]
    );
    return result.rows;
  }

  static async findByOpportunity(opportunity_id, industry_id) {
    // Only if industry owns the opportunity
    const opp = await db.query(`SELECT 1 FROM opportunities WHERE id = $1 AND industry_id = $2`, [opportunity_id, industry_id]);
    if (opp.rowCount === 0) throw new Error('Unauthorized');

    const result = await db.query(
      `SELECT a.*, u.name as student_name, u.email as student_email
       FROM applications a
       JOIN users u ON a.student_id = u.id
       WHERE a.opportunity_id = $1
       ORDER BY a.created_at DESC`,
      [opportunity_id]
    );
    return result.rows;
  }

  static async updateStatus(application_id, opportunity_id, industry_id, status) {
    const opp = await db.query(`SELECT 1 FROM opportunities WHERE id = $1 AND industry_id = $2`, [opportunity_id, industry_id]);
    if (opp.rowCount === 0) throw new Error('Unauthorized');

    const result = await db.query(
      `UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2 AND opportunity_id = $3 RETURNING *`,
      [status, application_id, opportunity_id]
    );
    return result.rows[0];
  }
}

class Notification {
  static async create(user_id, title, message, type, reference_id) {
    const result = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, title, message, type, reference_id]
    );
    return result.rows[0];
  }

  static async findUnread(user_id) {
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 AND is_read = FALSE ORDER BY created_at DESC`,
      [user_id]
    );
    return result.rows;
  }

  static async findAll(user_id) {
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [user_id]
    );
    return result.rows;
  }

  static async markAsRead(id, user_id) {
    const result = await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, user_id]
    );
    return result.rows[0];
  }
  
  static async markAllAsRead(user_id) {
    await db.query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1`, [user_id]);
  }
}

module.exports = { Opportunity, Application, Notification };
