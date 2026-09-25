const { getPool } = require('../config/database');

const memoryStudentProfiles = new Map();

function createDefaultProfile(userId) {
  return {
    userId,
    name: '',
    email: '',
    phone: '',
    profilePhoto: '',
    dateOfBirth: null,
    gender: '',
    currentCity: '',
    state: '',
    country: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    otherLinks: [],
    resumeFileUrl: '',
    resumeParsedData: null,
    parsedSkills: [],
    placementReadiness: {},
    academicInfo: {
      university: '',
      degree: '',
      graduationYear: '',
      cgpa: '',
      department: '',
    },
    careerGoal: '',
    targetRole: '',
    skills: [],
    topics: [],
    skillProfile: {
      summary: '',
      strengths: [],
      gaps: [],
    },
    topicScores: [],
    projects: [],
    internships: [],
    certifications: [],
    portfolio: {
      summary: '',
      links: [],
      highlights: [],
    },
  };
}

function sanitizeProfile(profile = {}) {
  const base = createDefaultProfile(profile.userId || null);
  return {
    ...base,
    ...profile,
    name: profile.name || base.name,
    email: profile.email || base.email,
    phone: profile.phone || base.phone,
    profilePhoto: profile.profilePhoto || base.profilePhoto,
    dateOfBirth: profile.dateOfBirth || base.dateOfBirth,
    gender: profile.gender || base.gender,
    currentCity: profile.currentCity || base.currentCity,
    state: profile.state || base.state,
    country: profile.country || base.country,
    linkedinUrl: profile.linkedinUrl || base.linkedinUrl,
    githubUrl: profile.githubUrl || base.githubUrl,
    portfolioUrl: profile.portfolioUrl || base.portfolioUrl,
    otherLinks: Array.isArray(profile.otherLinks) ? profile.otherLinks : [],
    resumeFileUrl: profile.resumeFileUrl || base.resumeFileUrl,
    resumeParsedData: profile.resumeParsedData || base.resumeParsedData,
    parsedSkills: Array.isArray(profile.parsedSkills) ? profile.parsedSkills : [],
    placementReadiness: profile.placementReadiness || base.placementReadiness,
    academicInfo: {
      ...base.academicInfo,
      ...(profile.academicInfo || {}),
    },
    skillProfile: {
      ...base.skillProfile,
      ...(profile.skillProfile || {}),
      strengths: Array.isArray(profile.skillProfile?.strengths) ? profile.skillProfile.strengths : [],
      gaps: Array.isArray(profile.skillProfile?.gaps) ? profile.skillProfile.gaps : [],
    },
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    topics: Array.isArray(profile.topics) ? profile.topics : [],
    topicScores: Array.isArray(profile.topicScores) ? profile.topicScores : [],
    projects: Array.isArray(profile.projects) ? profile.projects : [],
    internships: Array.isArray(profile.internships) ? profile.internships : [],
    certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
    portfolio: {
      ...base.portfolio,
      ...(profile.portfolio || {}),
      links: Array.isArray(profile.portfolio?.links) ? profile.portfolio.links : [],
      highlights: Array.isArray(profile.portfolio?.highlights) ? profile.portfolio.highlights : [],
    },
  };
}

function normalizeSkillEntry(skill = {}) {
  return {
    name: String(skill.name || '').trim(),
    level: Number(skill.level ?? 0),
    confidence: Number(skill.confidence ?? 0),
  };
}

function normalizeTopicEntry(topic = {}) {
  return {
    name: String(topic.name || '').trim(),
    score: Number(topic.score ?? 0),
    mastery: String(topic.mastery || 'Developing').trim(),
  };
}

function assertDatabaseReady() {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database connection is not configured. Set DATABASE_URL and run npm run migrate.');
  }
  return pool;
}

async function getStudentProfile(userId) {
  const pool = assertDatabaseReady();
  const id = Number(userId);

  const result = await pool.query(`
    SELECT sp.*, u.name, u.email, u.phone, u.profile_photo
    FROM student_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.user_id = $1
  `, [id]);

  if (!result.rows[0]) {
    return sanitizeProfile({ userId: id });
  }

  const row = result.rows[0];
  return sanitizeProfile({
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    profilePhoto: row.profile_photo,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    currentCity: row.current_city,
    state: row.state,
    country: row.country,
    linkedinUrl: row.linkedin_url,
    githubUrl: row.github_url,
    portfolioUrl: row.portfolio_url,
    otherLinks: row.other_links || [],
    resumeFileUrl: row.resume_file_url,
    resumeParsedData: row.resume_parsed_data,
    parsedSkills: row.parsed_skills || [],
    placementReadiness: row.placement_readiness || {},
    academicInfo: row.academic_info || {},
    careerGoal: row.career_goal || '',
    targetRole: row.target_role || '',
    skills: row.skills || [],
    topics: row.topics || [],
    skillProfile: row.skill_profile || {},
    topicScores: row.topic_scores || [],
    projects: row.projects || [],
    internships: row.internships || [],
    certifications: row.certifications || [],
    portfolio: row.portfolio || {},
  });
}

async function upsertStudentProfile(userId, payload = {}) {
  const profile = sanitizeProfile({ userId: Number(userId), ...payload });
  const pool = assertDatabaseReady();

  const result = await pool.query(
    `INSERT INTO student_profiles (
      user_id, academic_info, career_goal, target_role, skills, topics, skill_profile, topic_scores,
      projects, internships, certifications, portfolio, 
      date_of_birth, gender, current_city, state, country, linkedin_url, github_url, portfolio_url, other_links,
      resume_file_url, resume_parsed_data, parsed_skills, placement_readiness,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      academic_info = EXCLUDED.academic_info,
      career_goal = EXCLUDED.career_goal,
      target_role = EXCLUDED.target_role,
      skills = EXCLUDED.skills,
      topics = EXCLUDED.topics,
      skill_profile = EXCLUDED.skill_profile,
      topic_scores = EXCLUDED.topic_scores,
      projects = EXCLUDED.projects,
      internships = EXCLUDED.internships,
      certifications = EXCLUDED.certifications,
      portfolio = EXCLUDED.portfolio,
      date_of_birth = EXCLUDED.date_of_birth,
      gender = EXCLUDED.gender,
      current_city = EXCLUDED.current_city,
      state = EXCLUDED.state,
      country = EXCLUDED.country,
      linkedin_url = EXCLUDED.linkedin_url,
      github_url = EXCLUDED.github_url,
      portfolio_url = EXCLUDED.portfolio_url,
      other_links = EXCLUDED.other_links,
      resume_file_url = EXCLUDED.resume_file_url,
      resume_parsed_data = EXCLUDED.resume_parsed_data,
      parsed_skills = EXCLUDED.parsed_skills,
      placement_readiness = EXCLUDED.placement_readiness,
      updated_at = NOW()
    RETURNING *`,
    [
      Number(userId),
      JSON.stringify(profile.academicInfo),
      profile.careerGoal,
      profile.targetRole,
      JSON.stringify(profile.skills),
      JSON.stringify(profile.topics),
      JSON.stringify(profile.skillProfile),
      JSON.stringify(profile.topicScores),
      JSON.stringify(profile.projects),
      JSON.stringify(profile.internships),
      JSON.stringify(profile.certifications),
      JSON.stringify(profile.portfolio),
      profile.dateOfBirth,
      profile.gender,
      profile.currentCity,
      profile.state,
      profile.country,
      profile.linkedinUrl,
      profile.githubUrl,
      profile.portfolioUrl,
      JSON.stringify(profile.otherLinks),
      profile.resumeFileUrl,
      profile.resumeParsedData ? JSON.stringify(profile.resumeParsedData) : null,
      JSON.stringify(profile.parsedSkills),
      JSON.stringify(profile.placementReadiness)
    ],
  );

  if (profile.phone !== undefined || profile.name !== undefined || profile.profilePhoto !== undefined) {
    const userUpdates = [];
    const userValues = [Number(userId)];
    let paramIndex = 2;
    if (profile.phone !== undefined) {
      userUpdates.push(`phone = $${paramIndex++}`);
      userValues.push(profile.phone);
    }
    if (profile.name !== undefined) {
      userUpdates.push(`name = $${paramIndex++}`);
      userValues.push(profile.name);
    }
    if (profile.profilePhoto !== undefined) {
      userUpdates.push(`profile_photo = $${paramIndex++}`);
      userValues.push(profile.profilePhoto);
    }
    if (userUpdates.length > 0) {
      await pool.query(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = $1`, userValues);
    }
  }

  const row = result.rows[0];
  const persisted = sanitizeProfile({
    userId: row.user_id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    profilePhoto: profile.profilePhoto,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    currentCity: row.current_city,
    state: row.state,
    country: row.country,
    linkedinUrl: row.linkedin_url,
    githubUrl: row.github_url,
    portfolioUrl: row.portfolio_url,
    otherLinks: row.other_links || [],
    resumeFileUrl: row.resume_file_url,
    resumeParsedData: row.resume_parsed_data,
    parsedSkills: row.parsed_skills || [],
    placementReadiness: row.placement_readiness || {},
    academicInfo: row.academic_info || {},
    careerGoal: row.career_goal || '',
    targetRole: row.target_role || '',
    skills: row.skills || [],
    topics: row.topics || [],
    skillProfile: row.skill_profile || {},
    topicScores: row.topic_scores || [],
    projects: row.projects || [],
    internships: row.internships || [],
    certifications: row.certifications || [],
    portfolio: row.portfolio || {},
  });

  memoryStudentProfiles.set(Number(userId), persisted);
  return persisted;
}

async function updateProfilePhoto(userId, photoUrl) {
  const pool = assertDatabaseReady();
  await pool.query(`UPDATE users SET profile_photo = $2 WHERE id = $1`, [Number(userId), photoUrl]);
  return getStudentProfile(userId);
}

async function updateResumeFile(userId, resumeUrl, parsedData, parsedSkills) {
  const pool = assertDatabaseReady();
  
  // Ensure profile row exists first
  await pool.query(`
    INSERT INTO student_profiles (user_id) 
    VALUES ($1) 
    ON CONFLICT (user_id) DO NOTHING
  `, [Number(userId)]);
  
  await pool.query(`
    UPDATE student_profiles 
    SET resume_file_url = $2,
        resume_parsed_data = $3,
        parsed_skills = $4,
        updated_at = NOW()
    WHERE user_id = $1
  `, [
    Number(userId), 
    resumeUrl, 
    parsedData ? JSON.stringify(parsedData) : null,
    JSON.stringify(parsedSkills || [])
  ]);
  
  return getStudentProfile(userId);
}

function computeOverallReadiness(skills = [], topics = []) {
  const skillLevels = skills.map((skill) => Number(skill.level ?? 0)).filter((value) => Number.isFinite(value));
  const topicScores = topics.map((topic) => Number(topic.score ?? topic.level ?? 0)).filter((value) => Number.isFinite(value));

  const combined = [...skillLevels, ...topicScores];

  if (!combined.length) {
    return 0;
  }

  const average = combined.reduce((sum, value) => sum + value, 0) / combined.length;
  return Math.round(Math.min(Math.max(average, 0), 100));
}

function buildDashboard(profile = {}) {
  const skills = Array.isArray(profile.skills) ? profile.skills.map(normalizeSkillEntry) : [];
  const topics = Array.isArray(profile.topics) ? profile.topics.map(normalizeTopicEntry) : [];
  const skillOverview = skills.map((skill) => ({
    name: skill.name,
    level: Math.min(Math.max(skill.level, 0), 100),
    confidence: Math.min(Math.max(skill.confidence, 0), 1),
  }));

  const topicPerformance = topics.map((topic) => ({
    name: topic.name,
    score: Math.min(Math.max(topic.score, 0), 100),
    mastery: topic.mastery,
  }));

  const skillGaps = skills
    .filter((skill) => Number(skill.level) < 70)
    .map((skill) => ({
      name: skill.name,
      gap: Math.max(70 - Number(skill.level), 0),
      recommendation: 'Strengthen core concepts and add evidence through projects or assessments.',
    }));

  const recommendedOpportunities = [
    {
      title: 'Frontend Engineer roles',
      match: 'High',
      reason: 'Your JavaScript and React foundations are trending above peer readiness.',
    },
    {
      title: 'Product engineering internships',
      match: 'Medium',
      reason: 'Add stronger API design and project evidence to improve fit.',
    },
  ];

  const recentAssessments = Array.isArray(profile.topicScores) && profile.topicScores.length
    ? profile.topicScores.slice(0, 3).map((item) => ({
        name: item.name || 'Assessment',
        score: Number(item.score ?? 0),
        date: item.date || new Date().toISOString().slice(0, 10),
      }))
    : [{ name: 'No assessments recorded yet', score: 0, date: '—' }];

  return {
    overallReadiness: computeOverallReadiness(skills, topics),
    targetRole: profile.targetRole || 'Not specified',
    skillOverview,
    topicPerformance,
    skillGaps,
    recommendedOpportunities,
    recentAssessments,
  };
}

module.exports = {
  createDefaultProfile,
  sanitizeProfile,
  normalizeSkillEntry,
  normalizeTopicEntry,
  getStudentProfile,
  upsertStudentProfile,
  updateProfilePhoto,
  updateResumeFile,
  buildDashboard,
  memoryStudentProfiles,
};
