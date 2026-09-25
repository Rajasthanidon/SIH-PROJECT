const { getPool } = require('../config/database');
const { findUserById } = require('./user.repository');
const { getStudentProfile, memoryStudentProfiles, sanitizeProfile } = require('./student.repository');
const { memoryCompanies, memoryOpportunities } = require('./industry.repository');

const defaultMentorship = [
  { id: 'ment-1', studentName: 'Aarav', mentor: 'Dr. Mehta', focus: 'React and APIs' },
  { id: 'ment-2', studentName: 'Nisha', mentor: 'Prof. Sinha', focus: 'Testing and CI' },
];

const defaultWorkshops = [
  { id: 'ws-1', title: 'Communication for Product Teams', attendees: 48, date: '2026-10-15' },
  { id: 'ws-2', title: 'Full-stack readiness lab', attendees: 34, date: '2026-10-29' },
];

const defaultCollaboration = [
  { id: 'collab-1', partner: 'Northstar Labs', focus: 'Frontend engineering', status: 'active' },
  { id: 'collab-2', partner: 'PeakWorks', focus: 'Testing and QA', status: 'planning' },
];

const defaultTrends = [
  { skill: 'JavaScript', demand: 92, averageGap: 12 },
  { skill: 'React', demand: 88, averageGap: 10 },
  { skill: 'Testing', demand: 72, averageGap: 18 },
  { skill: 'TypeScript', demand: 70, averageGap: 15 },
];

async function getStudentSummaries() {
  const pool = getPool();

  if (pool) {
    try {
      const result = await pool.query(`
        SELECT sp.user_id, sp.target_role, sp.skills, sp.topics, sp.projects, sp.internships, sp.certifications, u.name, u.email
        FROM student_profiles sp
        JOIN users u ON u.id = sp.user_id
        ORDER BY sp.updated_at DESC
      `);

      return result.rows.map((row) => {
        const skillList = Array.isArray(row.skills) ? row.skills : [];
        const topicList = Array.isArray(row.topics) ? row.topics : [];
        const readiness = skillList.length
          ? Math.round(skillList.reduce((sum, skill) => sum + Number(skill.level || 0), 0) / skillList.length)
          : 0;

        return {
          userId: Number(row.user_id),
          name: row.name,
          targetRole: row.target_role || 'Not specified',
          readiness,
          skills: skillList.slice(0, 5),
          topicStrengths: topicList.slice(0, 5),
          projectCount: Array.isArray(row.projects) ? row.projects.length : 0,
          internshipCount: Array.isArray(row.internships) ? row.internships.length : 0,
          certificationCount: Array.isArray(row.certifications) ? row.certifications.length : 0,
        };
      });
    } catch (error) {
      // fallback to memory map below
    }
  }

  const students = [];

  for (const [userId, profile] of memoryStudentProfiles.entries()) {
    const user = await findUserById(userId);
    if (!user || user.role !== 'student') {
      continue;
    }

    const filtered = sanitizeProfile(profile);
    const skills = Array.isArray(filtered.skills) ? filtered.skills : [];
    const topics = Array.isArray(filtered.topics) ? filtered.topics : [];
    const readiness = skills.length
      ? Math.round(skills.reduce((sum, skill) => sum + Number(skill.level || 0), 0) / skills.length)
      : 0;

    students.push({
      userId: Number(userId),
      name: user.name,
      targetRole: filtered.targetRole || 'Not specified',
      readiness,
      skills: skills.slice(0, 5),
      topicStrengths: topics.slice(0, 5),
      projectCount: Array.isArray(filtered.projects) ? filtered.projects.length : 0,
      internshipCount: Array.isArray(filtered.internships) ? filtered.internships.length : 0,
      certificationCount: Array.isArray(filtered.certifications) ? filtered.certifications.length : 0,
    });
  }

  return students.sort((a, b) => b.readiness - a.readiness);
}

async function getFacultyDashboard() {
  const students = await getStudentSummaries();
  const averageReadiness = students.length
    ? Math.round(students.reduce((sum, item) => sum + Number(item.readiness || 0), 0) / students.length)
    : 0;

  const weakSkills = {};
  students.forEach((student) => {
    (student.skills || []).forEach((skill) => {
      const name = String(skill.name || '').trim();
      if (!name) {
        return;
      }

      const value = Number(skill.level || 0);
      weakSkills[name] = (weakSkills[name] || 0) + Math.max(0, 70 - value);
    });
  });

  const topWeakSkills = Object.entries(weakSkills)
    .map(([name, gapScore]) => ({ name, gapScore: Math.round(gapScore / Math.max(students.length, 1)) }))
    .sort((a, b) => b.gapScore - a.gapScore)
    .slice(0, 5);

  return {
    totalStudents: students.length,
    averageReadiness,
    mentorshipCount: defaultMentorship.length,
    workshopCount: defaultWorkshops.length,
    collaborationCount: defaultCollaboration.length,
    topWeakSkills,
    students: students.slice(0, 5),
  };
}

async function getFacultyStudentProfile(userId) {
  const profile = await getStudentProfile(userId);
  const user = await findUserById(userId);

  if (!profile || !user) {
    return null;
  }

  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const topics = Array.isArray(profile.topics) ? profile.topics : [];
  const readiness = skills.length
    ? Math.round(skills.reduce((sum, skill) => sum + Number(skill.level || 0), 0) / skills.length)
    : 0;

  return {
    userId: Number(userId),
    name: user.name,
    targetRole: profile.targetRole || 'Not specified',
    readiness,
    skillProfile: profile.skillProfile || {},
    skills,
    topics,
    gaps: profile.skillProfile?.gaps || [],
    projects: Array.isArray(profile.projects) ? profile.projects.slice(0, 5) : [],
    internships: Array.isArray(profile.internships) ? profile.internships.slice(0, 5) : [],
    certifications: Array.isArray(profile.certifications) ? profile.certifications.slice(0, 5) : [],
  };
}

async function getFacultyAnalytics() {
  const students = await getStudentSummaries();
  const opportunities = Array.from(memoryOpportunities.values());
  const companyCount = memoryCompanies.size;
  const totalSkills = new Set();

  students.forEach((student) => {
    (student.skills || []).forEach((skill) => totalSkills.add(String(skill.name || '').trim()));
  });

  return {
    summary: {
      students: students.length,
      averageReadiness: students.length
        ? Math.round(students.reduce((sum, student) => sum + Number(student.readiness || 0), 0) / students.length)
        : 0,
      activeOpportunities: opportunities.length,
      companyCount,
    },
    weakTopicSummary: defaultTrends,
    skillCoverage: Array.from(totalSkills).slice(0, 10).map((skill) => ({ skill, coverage: 75 })),
  };
}

async function getMentorshipData() {
  return defaultMentorship;
}

async function getTrainingRecommendations() {
  const students = await getStudentSummaries();
  return students.slice(0, 3).map((student, index) => ({
    studentId: student.userId,
    name: student.name,
    recommendedWorkshop: index % 2 === 0 ? 'Testing and QA lab' : 'Advanced React Sprint',
    focus: index % 2 === 0 ? 'Automated testing' : 'Component architecture',
  }));
}

async function getWorkshops() {
  return defaultWorkshops;
}

async function getIndustryCollaboration() {
  return defaultCollaboration;
}

async function getIndustrySkillTrends() {
  return defaultTrends;
}

module.exports = {
  getStudentSummaries,
  getFacultyDashboard,
  getFacultyStudentProfile,
  getFacultyAnalytics,
  getMentorshipData,
  getTrainingRecommendations,
  getWorkshops,
  getIndustryCollaboration,
  getIndustrySkillTrends,
};
