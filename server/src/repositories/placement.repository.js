const { getPool } = require('../config/database');
const { memoryStudentProfiles, sanitizeProfile } = require('./student.repository');
const { memoryCompanies, memoryOpportunities, memoryApplications, memoryShortlists } = require('./industry.repository');
const { findUserById } = require('./user.repository');

const defaultRecruiters = [
  { id: 1, name: 'Northstar Labs', role: 'recruiter', activeDrives: 3 },
  { id: 2, name: 'PeakWorks', role: 'recruiter', activeDrives: 2 },
];

const memoryPlacementImports = [];
const memoryDrives = [
  { id: 'drive-1', title: 'Campus hiring drive', status: 'open', company: 'Northstar Labs', date: '2026-11-02' },
  { id: 'drive-2', title: 'Frontend internship sprint', status: 'scheduled', company: 'PeakWorks', date: '2026-11-09' },
];

async function importStudentsFromCsv(csvText = '') {
  const rows = String(csvText || '').split(/\r?\n/).filter(Boolean);
  if (!rows.length) {
    return [];
  }

  const header = rows[0].split(',').map((column) => column.trim().toLowerCase());
  const records = rows.slice(1).map((line) => {
    const values = line.split(',').map((entry) => entry.trim());
    const item = {};

    header.forEach((key, index) => {
      item[key] = values[index] || '';
    });

    return item;
  });

  const imported = records.map((record, index) => ({
    id: `csv-${Date.now()}-${index}`,
    name: record.name || `Imported Student ${index + 1}`,
    email: record.email || `student${index + 1}@example.com`,
    role: record.role || 'student',
  }));

  memoryPlacementImports.push(...imported);
  return imported;
}

async function getPlacementDashboard() {
  const pool = getPool();

  if (pool) {
    try {
      const result = await pool.query(`
        SELECT COUNT(*)::int AS student_count FROM users WHERE role = 'student'
      `);

      return {
        students: Number(result.rows[0]?.student_count || 0),
        activeDrives: memoryDrives.filter((item) => item.status === 'open' || item.status === 'scheduled').length,
        recruiters: defaultRecruiters.length,
        applications: Array.from(memoryApplications.values()).length,
      };
    } catch (error) {
      // fallback below
    }
  }

  const students = [];
  for (const [userId, profile] of memoryStudentProfiles.entries()) {
    const user = await findUserById(userId);
    if (user && user.role === 'student') {
      students.push({ userId, profile });
    }
  }

  return {
    students: students.length + memoryPlacementImports.length,
    activeDrives: memoryDrives.filter((item) => item.status === 'open' || item.status === 'scheduled').length,
    recruiters: defaultRecruiters.length,
    applications: Array.from(memoryApplications.values()).length,
  };
}

async function getPlacementStudentRecords() {
  const results = [];

  for (const [userId, profile] of memoryStudentProfiles.entries()) {
    const user = await findUserById(userId);
    if (!user || user.role !== 'student') {
      continue;
    }

    const sanitized = sanitizeProfile(profile);
    const skills = Array.isArray(sanitized.skills) ? sanitized.skills : [];
    const readiness = skills.length
      ? Math.round(skills.reduce((sum, skill) => sum + Number(skill.level || 0), 0) / skills.length)
      : 0;

    results.push({
      userId: Number(userId),
      name: user.name,
      targetRole: sanitized.targetRole || 'Not specified',
      readiness,
      skills: skills.slice(0, 4),
      projectCount: Array.isArray(sanitized.projects) ? sanitized.projects.length : 0,
      internshipCount: Array.isArray(sanitized.internships) ? sanitized.internships.length : 0,
      certificationCount: Array.isArray(sanitized.certifications) ? sanitized.certifications.length : 0,
    });
  }

  return results;
}

async function getRecruiters() {
  return defaultRecruiters;
}

async function getDrives() {
  return memoryDrives;
}

async function getOpportunities() {
  return Array.from(memoryOpportunities.values()).map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.status,
    companyId: item.companyId,
    requiredSkills: item.requiredSkills || [],
    minimumProficiency: item.minimumProficiency || 70,
  }));
}

async function getApplications() {
  const items = Array.from(memoryApplications.values());
  return items.map((item) => ({
    id: item.id,
    status: item.status,
    candidateId: item.candidateId,
    opportunityId: item.opportunityId,
    feedback: item.feedback || 'No feedback',
  }));
}

async function getShortlists() {
  return Array.from(memoryShortlists.values()).map((item) => ({
    id: item.id,
    candidateId: item.candidateId,
    opportunityId: item.opportunityId,
    reason: item.reason || 'Shortlisted for review',
  }));
}

async function getPlacementTracking() {
  return [
    { studentId: 1, status: 'placed', company: 'Northstar Labs' },
    { studentId: 2, status: 'shortlisted', company: 'PeakWorks' },
  ];
}

async function getPlacementAnalytics() {
  const students = await getPlacementStudentRecords();
  const averageReadiness = students.length
    ? Math.round(students.reduce((sum, item) => sum + Number(item.readiness || 0), 0) / students.length)
    : 0;

  const topSkills = {};
  students.forEach((student) => {
    (student.skills || []).forEach((skill) => {
      const label = String(skill.name || '').trim();
      if (!label) {
        return;
      }

      topSkills[label] = (topSkills[label] || 0) + Number(skill.level || 0);
    });
  });

  return {
    summary: {
      students: students.length,
      averageReadiness,
      applications: (await getApplications()).length,
      placements: (await getPlacementTracking()).filter((item) => item.status === 'placed').length,
    },
    readinessBySkill: Object.entries(topSkills)
      .map(([skill, total]) => ({ skill, readiness: Math.round(total / Math.max(students.length, 1)) }))
      .sort((a, b) => b.readiness - a.readiness)
      .slice(0, 5),
  };
}

async function getReports() {
  return {
    title: 'Placement report',
    generatedAt: new Date().toISOString(),
    summary: {
      offers: 12,
      shortlisted: 18,
      activeDrives: memoryDrives.length,
    },
  };
}

module.exports = {
  importStudentsFromCsv,
  getPlacementDashboard,
  getPlacementStudentRecords,
  getRecruiters,
  getDrives,
  getOpportunities,
  getApplications,
  getShortlists,
  getPlacementTracking,
  getPlacementAnalytics,
  getReports,
  memoryPlacementImports,
};
