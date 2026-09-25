const crypto = require('node:crypto');
const { getPool } = require('../config/database');
const { findUserById } = require('./user.repository');
const { memoryStudentProfiles } = require('./student.repository');

const memoryCompanies = new Map();
const memoryOpportunities = new Map();
const memoryApplications = new Map();
const memoryShortlists = new Map();

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item, index, self) => self.indexOf(item) === index);
}

async function ensureIndustryTables() {
  const pool = getPool();

  if (!pool) {
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS industry_companies (
        id UUID PRIMARY KEY,
        recruiter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_name TEXT NOT NULL,
        industry TEXT,
        website TEXT,
        location TEXT,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS industry_opportunities (
        id UUID PRIMARY KEY,
        recruiter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES industry_companies(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        required_skills JSONB NOT NULL DEFAULT '[]',
        required_topics JSONB NOT NULL DEFAULT '[]',
        minimum_proficiency INTEGER NOT NULL DEFAULT 0,
        eligibility TEXT,
        preferred_skills JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS industry_applications (
        id UUID PRIMARY KEY,
        recruiter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES industry_companies(id) ON DELETE CASCADE,
        opportunity_id UUID NOT NULL REFERENCES industry_opportunities(id) ON DELETE CASCADE,
        candidate_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'reviewing',
        feedback TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS industry_shortlists (
        id UUID PRIMARY KEY,
        recruiter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES industry_companies(id) ON DELETE CASCADE,
        opportunity_id UUID NOT NULL REFERENCES industry_opportunities(id) ON DELETE CASCADE,
        candidate_id INTEGER NOT NULL,
        reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } catch (error) {
    // PostgreSQL can be unavailable during local development, so in-memory storage remains the fallback.
  }
}

async function upsertCompany(recruiterId, payload = {}) {
  const companyId = String(payload.id || createId());
  const safe = {
    id: companyId,
    recruiterId: Number(recruiterId),
    companyName: String(payload.companyName || payload.company_name || '').trim(),
    industry: String(payload.industry || '').trim(),
    website: String(payload.website || '').trim(),
    location: String(payload.location || '').trim(),
    description: String(payload.description || '').trim(),
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const pool = getPool();

  if (!pool) {
    memoryCompanies.set(Number(recruiterId), safe);
    return safe;
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query(
      `INSERT INTO industry_companies (id, recruiter_id, company_name, industry, website, location, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         industry = EXCLUDED.industry,
         website = EXCLUDED.website,
         location = EXCLUDED.location,
         description = EXCLUDED.description,
         updated_at = NOW()
       RETURNING *`,
      [
        safe.id,
        safe.recruiterId,
        safe.companyName,
        safe.industry,
        safe.website,
        safe.location,
        safe.description,
      ],
    );

    const row = result.rows[0] || safe;
    memoryCompanies.set(Number(recruiterId), {
      ...safe,
      id: row.id,
      companyName: row.company_name,
      recruiterId: row.recruiter_id,
    });
    return {
      ...safe,
      id: row.id,
      companyName: row.company_name,
      recruiterId: row.recruiter_id,
    };
  } catch (error) {
    memoryCompanies.set(Number(recruiterId), safe);
    return safe;
  }
}

async function getCompanyByRecruiterId(recruiterId) {
  const pool = getPool();

  if (!pool) {
    return memoryCompanies.get(Number(recruiterId)) || null;
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query('SELECT * FROM industry_companies WHERE recruiter_id = $1 ORDER BY created_at DESC LIMIT 1', [Number(recruiterId)]);
    if (!result.rows[0]) {
      return memoryCompanies.get(Number(recruiterId)) || null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      recruiterId: row.recruiter_id,
      companyName: row.company_name,
      industry: row.industry,
      website: row.website,
      location: row.location,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    return memoryCompanies.get(Number(recruiterId)) || null;
  }
}

async function getCompanyById(id) {
  const pool = getPool();
  const safeId = String(id);

  if (!pool) {
    const company = Array.from(memoryCompanies.values()).find((item) => String(item.id) === safeId) || null;
    return company;
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query('SELECT * FROM industry_companies WHERE id = $1', [safeId]);
    if (!result.rows[0]) {
      const company = Array.from(memoryCompanies.values()).find((item) => String(item.id) === safeId) || null;
      return company;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      recruiterId: row.recruiter_id,
      companyName: row.company_name,
      industry: row.industry,
      website: row.website,
      location: row.location,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    const company = Array.from(memoryCompanies.values()).find((item) => String(item.id) === safeId) || null;
    return company;
  }
}

async function createOpportunity(opportunity) {
  const safe = {
    ...opportunity,
    id: String(opportunity.id || createId()),
    type: String(opportunity.type || 'job').toLowerCase(),
    title: String(opportunity.title || '').trim(),
    description: String(opportunity.description || '').trim(),
    location: String(opportunity.location || '').trim(),
    status: String(opportunity.status || 'draft').trim().toLowerCase(),
    requiredSkills: normalizeList(opportunity.requiredSkills || opportunity.required_skills),
    requiredTopics: normalizeList(opportunity.requiredTopics || opportunity.required_topics),
    minimumProficiency: Number(opportunity.minimumProficiency ?? opportunity.minimum_proficiency ?? 0),
    eligibility: String(opportunity.eligibility || '').trim(),
    preferredSkills: normalizeList(opportunity.preferredSkills || opportunity.preferred_skills),
    recruiterId: Number(opportunity.recruiterId),
    companyId: String(opportunity.companyId || opportunity.company_id || ''),
    createdAt: opportunity.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const pool = getPool();

  if (!pool) {
    memoryOpportunities.set(safe.id, safe);
    return safe;
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query(
      `INSERT INTO industry_opportunities (id, recruiter_id, company_id, type, title, description, location, status, required_skills, required_topics, minimum_proficiency, eligibility, preferred_skills, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) RETURNING *`,
      [
        safe.id,
        safe.recruiterId,
        safe.companyId,
        safe.type,
        safe.title,
        safe.description,
        safe.location,
        safe.status,
        JSON.stringify(safe.requiredSkills),
        JSON.stringify(safe.requiredTopics),
        safe.minimumProficiency,
        safe.eligibility,
        JSON.stringify(safe.preferredSkills),
      ],
    );

    const row = result.rows[0];
    const persisted = {
      ...safe,
      id: row.id,
      companyId: row.company_id,
      recruiterId: row.recruiter_id,
      type: row.type,
      title: row.title,
      description: row.description,
      status: row.status,
      requiredSkills: row.required_skills || [],
      requiredTopics: row.required_topics || [],
      minimumProficiency: Number(row.minimum_proficiency || 0),
      eligibility: row.eligibility,
      preferredSkills: row.preferred_skills || [],
    };
    memoryOpportunities.set(persisted.id, persisted);
    return persisted;
  } catch (error) {
    memoryOpportunities.set(safe.id, safe);
    return safe;
  }
}

async function getOpportunityById(id) {
  const safeId = String(id);
  const pool = getPool();

  if (!pool) {
    return memoryOpportunities.get(safeId) || null;
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query('SELECT * FROM industry_opportunities WHERE id = $1', [safeId]);
    if (!result.rows[0]) {
      return memoryOpportunities.get(safeId) || null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      recruiterId: row.recruiter_id,
      companyId: row.company_id,
      type: row.type,
      title: row.title,
      description: row.description,
      location: row.location,
      status: row.status,
      requiredSkills: row.required_skills || [],
      requiredTopics: row.required_topics || [],
      minimumProficiency: Number(row.minimum_proficiency || 0),
      eligibility: row.eligibility,
      preferredSkills: row.preferred_skills || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    return memoryOpportunities.get(safeId) || null;
  }
}

async function listOpportunitiesForRecruiter(recruiterId) {
  const pool = getPool();
  const safeRecruiterId = Number(recruiterId);

  if (!pool) {
    return Array.from(memoryOpportunities.values())
      .filter((item) => Number(item.recruiterId) === safeRecruiterId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query('SELECT * FROM industry_opportunities WHERE recruiter_id = $1 ORDER BY created_at DESC', [safeRecruiterId]);
    return result.rows.map((row) => ({
      id: row.id,
      recruiterId: row.recruiter_id,
      companyId: row.company_id,
      type: row.type,
      title: row.title,
      description: row.description,
      location: row.location,
      status: row.status,
      requiredSkills: row.required_skills || [],
      requiredTopics: row.required_topics || [],
      minimumProficiency: Number(row.minimum_proficiency || 0),
      eligibility: row.eligibility,
      preferredSkills: row.preferred_skills || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    return Array.from(memoryOpportunities.values())
      .filter((item) => Number(item.recruiterId) === safeRecruiterId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

async function updateOpportunityById(opportunityId, updates) {
  const existing = await getOpportunityById(opportunityId);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...updates,
    id: String(opportunityId),
    recruiterId: Number(existing.recruiterId),
    companyId: String(existing.companyId || updates.companyId || ''),
    title: String(updates.title || existing.title || '').trim(),
    description: String(updates.description ?? existing.description ?? '').trim(),
    location: String(updates.location ?? existing.location ?? '').trim(),
    status: String(updates.status ?? existing.status ?? 'draft').trim().toLowerCase(),
    requiredSkills: normalizeList(updates.requiredSkills ?? existing.requiredSkills ?? []),
    requiredTopics: normalizeList(updates.requiredTopics ?? existing.requiredTopics ?? []),
    minimumProficiency: Number(updates.minimumProficiency ?? existing.minimumProficiency ?? 0),
    eligibility: String(updates.eligibility ?? existing.eligibility ?? '').trim(),
    preferredSkills: normalizeList(updates.preferredSkills ?? existing.preferredSkills ?? []),
    updatedAt: new Date().toISOString(),
  };

  const pool = getPool();

  if (!pool) {
    memoryOpportunities.set(updated.id, updated);
    return updated;
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query(
      `UPDATE industry_opportunities
       SET type = $2,
           title = $3,
           description = $4,
           location = $5,
           status = $6,
           required_skills = $7,
           required_topics = $8,
           minimum_proficiency = $9,
           eligibility = $10,
           preferred_skills = $11,
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        updated.id,
        updated.type,
        updated.title,
        updated.description,
        updated.location,
        updated.status,
        JSON.stringify(updated.requiredSkills),
        JSON.stringify(updated.requiredTopics),
        updated.minimumProficiency,
        updated.eligibility,
        JSON.stringify(updated.preferredSkills),
      ],
    );

    const row = result.rows[0] || updated;
    const persisted = {
      ...updated,
      companyId: row.company_id || updated.companyId,
      recruiterId: row.recruiter_id || updated.recruiterId,
      type: row.type || updated.type,
      title: row.title || updated.title,
      status: row.status || updated.status,
      requiredSkills: row.required_skills || updated.requiredSkills,
      requiredTopics: row.required_topics || updated.requiredTopics,
      minimumProficiency: Number(row.minimum_proficiency || updated.minimumProficiency),
      eligibility: row.eligibility || updated.eligibility,
      preferredSkills: row.preferred_skills || updated.preferredSkills,
    };

    memoryOpportunities.set(updated.id, persisted);
    return persisted;
  } catch (error) {
    memoryOpportunities.set(updated.id, updated);
    return updated;
  }
}

async function createShortlist(shortlist) {
  const safe = {
    id: String(shortlist.id || createId()),
    recruiterId: Number(shortlist.recruiterId),
    companyId: String(shortlist.companyId || ''),
    opportunityId: String(shortlist.opportunityId || ''),
    candidateId: Number(shortlist.candidateId),
    reason: String(shortlist.reason || '').trim(),
    createdAt: shortlist.createdAt || new Date().toISOString(),
  };

  const pool = getPool();

  if (!pool) {
    memoryShortlists.set(safe.id, safe);
    return safe;
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query(
      `INSERT INTO industry_shortlists (id, recruiter_id, company_id, opportunity_id, candidate_id, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [safe.id, safe.recruiterId, safe.companyId, safe.opportunityId, safe.candidateId, safe.reason],
    );

    const row = result.rows[0];
    const persisted = {
      id: row.id,
      recruiterId: row.recruiter_id,
      companyId: row.company_id,
      opportunityId: row.opportunity_id,
      candidateId: row.candidate_id,
      reason: row.reason,
      createdAt: row.created_at,
    };
    memoryShortlists.set(persisted.id, persisted);
    return persisted;
  } catch (error) {
    memoryShortlists.set(safe.id, safe);
    return safe;
  }
}

async function listShortlistsForRecruiter(recruiterId) {
  const pool = getPool();
  const safeId = Number(recruiterId);

  if (!pool) {
    return Array.from(memoryShortlists.values()).filter((item) => Number(item.recruiterId) === safeId);
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query('SELECT * FROM industry_shortlists WHERE recruiter_id = $1 ORDER BY created_at DESC', [safeId]);
    return result.rows.map((row) => ({
      id: row.id,
      recruiterId: row.recruiter_id,
      companyId: row.company_id,
      opportunityId: row.opportunity_id,
      candidateId: row.candidate_id,
      reason: row.reason,
      createdAt: row.created_at,
    }));
  } catch (error) {
    return Array.from(memoryShortlists.values()).filter((item) => Number(item.recruiterId) === safeId);
  }
}

async function createApplication(application) {
  const safe = {
    id: String(application.id || createId()),
    recruiterId: Number(application.recruiterId),
    companyId: String(application.companyId || ''),
    opportunityId: String(application.opportunityId || ''),
    candidateId: Number(application.candidateId),
    status: String(application.status || 'reviewing').trim(),
    feedback: String(application.feedback || '').trim(),
    createdAt: application.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const pool = getPool();

  if (!pool) {
    memoryApplications.set(safe.id, safe);
    return safe;
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query(
      `INSERT INTO industry_applications (id, recruiter_id, company_id, opportunity_id, candidate_id, status, feedback, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [safe.id, safe.recruiterId, safe.companyId, safe.opportunityId, safe.candidateId, safe.status, safe.feedback],
    );

    const row = result.rows[0];
    const persisted = {
      id: row.id,
      recruiterId: row.recruiter_id,
      companyId: row.company_id,
      opportunityId: row.opportunity_id,
      candidateId: row.candidate_id,
      status: row.status,
      feedback: row.feedback,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    memoryApplications.set(persisted.id, persisted);
    return persisted;
  } catch (error) {
    memoryApplications.set(safe.id, safe);
    return safe;
  }
}

async function listApplicationsForRecruiter(recruiterId) {
  const pool = getPool();
  const safeId = Number(recruiterId);

  if (!pool) {
    return Array.from(memoryApplications.values())
      .filter((item) => Number(item.recruiterId) === safeId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query(`
      SELECT a.id, a.status, a.created_at, a.profile_snapshot,
             o.id as opportunity_id, o.title as job_title, o.company_name
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      WHERE o.industry_id = $1
      ORDER BY a.created_at DESC
    `, [safeId]);
    return result.rows.map((row) => ({
      id: row.id,
      recruiterId: safeId,
      companyName: row.company_name,
      opportunityId: row.opportunity_id,
      jobTitle: row.job_title,
      candidateId: row.profile_snapshot.user_id || row.profile_snapshot.student_id || 'Unknown',
      candidateName: row.profile_snapshot.name || 'Unknown',
      candidateEmail: row.profile_snapshot.email || '',
      resumeUrl: row.profile_snapshot.resume_file_url || null,
      status: row.status,
      feedback: '',
      createdAt: row.created_at,
      updatedAt: row.created_at,
    }));
  } catch (error) {
    return Array.from(memoryApplications.values())
      .filter((item) => Number(item.recruiterId) === safeId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

async function getApplicationById(applicationId) {
  const pool = getPool();
  const safeId = String(applicationId);

  if (!pool) {
    return memoryApplications.get(safeId) || null;
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query(`
      SELECT a.*, o.industry_id
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      WHERE a.id = $1
    `, [safeId]);
    if (!result.rows[0]) {
      return memoryApplications.get(safeId) || null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      recruiterId: row.industry_id, // Important for authorization
      opportunityId: row.opportunity_id,
      candidateId: row.student_id,
      status: row.status,
      feedback: row.feedback || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    return memoryApplications.get(safeId) || null;
  }
}

async function updateApplicationFeedback(applicationId, payload = {}) {
  const existing = await getApplicationById(applicationId);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    status: String(payload.status || existing.status || 'reviewing').trim(),
    feedback: String(payload.feedback || existing.feedback || '').trim(),
    updatedAt: new Date().toISOString(),
  };

  const pool = getPool();

  if (!pool) {
    memoryApplications.set(updated.id, updated);
    return updated;
  }

  try {
    await ensureIndustryTables();
    const result = await pool.query(
      `UPDATE applications
       SET status = $2, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [updated.id, updated.status],
    );

    const row = result.rows[0] || updated;
    const persisted = {
      ...updated,
      status: row.status || updated.status,
    };

    memoryApplications.set(updated.id, persisted);
    return persisted;
  } catch (error) {
    memoryApplications.set(updated.id, updated);
    return updated;
  }
}

async function searchCandidates(filters = {}) {
  const roleFilter = String(filters.role || '').trim();
  const skillFilter = String(filters.skill || '').trim();
  const minScore = Number(filters.minScore ?? 0);

  const results = [];

  for (const [userId, profile] of memoryStudentProfiles.entries()) {
    const user = await findUserById(userId);
    if (!user || user.role !== 'student') {
      continue;
    }

    const targetRole = String(profile.targetRole || '').trim();
    const roleMatch = !roleFilter || targetRole.toLowerCase().includes(roleFilter.toLowerCase()) || roleFilter.toLowerCase().includes(targetRole.toLowerCase());
    const skillMatch = !skillFilter || (Array.isArray(profile.skills) && profile.skills.some((item) => String(item.name || '').toLowerCase().includes(skillFilter.toLowerCase())));

    if (!roleMatch || !skillMatch) {
      continue;
    }

    const skillMap = new Map();
    (profile.skills || []).forEach((skill) => {
      skillMap.set(String(skill.name || '').trim().toLowerCase(), Number(skill.level ?? 0));
    });

    const topicMap = new Map();
    (profile.topics || []).forEach((topic) => {
      topicMap.set(String(topic.name || '').trim().toLowerCase(), Number(topic.score ?? 0));
    });

    const requiredSkills = skillFilter ? [skillFilter] : [];
    const matchedSkills = requiredSkills.length
      ? requiredSkills.map((name) => ({
          name,
          current: skillMap.get(name.toLowerCase()) || topicMap.get(name.toLowerCase()) || 0,
        }))
      : (profile.skills || []).slice(0, 3).map((skill) => ({
          name: skill.name,
          current: Number(skill.level ?? 0),
        }));

    const averageMatch = matchedSkills.length
      ? matchedSkills.reduce((sum, item) => sum + Number(item.current || 0), 0) / matchedSkills.length
      : 0;

    const score = Math.max(0, Math.min(100, Math.round(averageMatch)));

    if (score < minScore) {
      continue;
    }

    results.push({
      userId: Number(userId),
      name: user.name,
      email: user.email,
      targetRole,
      scorecard: {
        score,
        matchSummary: `${matchedSkills.length} relevant skills assessed`,
        matchedSkills: matchedSkills.map((item) => ({
          name: item.name,
          current: item.current,
        })),
        strengths: (profile.skills || []).slice(0, 3).map((skill) => skill.name),
        gaps: (profile.skills || []).filter((skill) => Number(skill.level ?? 0) < 70).map((skill) => skill.name),
      },
    });
  }

  return results.sort((a, b) => b.scorecard.score - a.scorecard.score);
}

module.exports = {
  ensureIndustryTables,
  upsertCompany,
  getCompanyByRecruiterId,
  getCompanyById,
  createOpportunity,
  getOpportunityById,
  listOpportunitiesForRecruiter,
  updateOpportunityById,
  createShortlist,
  listShortlistsForRecruiter,
  createApplication,
  listApplicationsForRecruiter,
  getApplicationById,
  updateApplicationFeedback,
  searchCandidates,
  memoryCompanies,
  memoryOpportunities,
  memoryApplications,
  memoryShortlists,
};
