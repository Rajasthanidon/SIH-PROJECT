const AppError = require('../utils/AppError');
const { getPool } = require('../config/database');
const studentRepository = require('../repositories/student.repository');
const skillGapService = require('./skillGapService');

function normalizeProfileInput(payload = {}) {
  const academicInfo = payload.academicInfo || {};
  const rawSkills = Array.isArray(payload.skills) ? payload.skills : [];
  const rawTopics = Array.isArray(payload.topics) ? payload.topics : [];

  return {
    academicInfo: {
      university: String(academicInfo.university || '').trim(),
      degree: String(academicInfo.degree || '').trim(),
      graduationYear: academicInfo.graduationYear ?? '',
      cgpa: academicInfo.cgpa ?? '',
      department: String(academicInfo.department || '').trim(),
    },
    careerGoal: String(payload.careerGoal || '').trim(),
    targetRole: String(payload.targetRole || '').trim(),
    skills: rawSkills.map((item) => {
      if (typeof item === 'string') {
        return studentRepository.normalizeSkillEntry({ name: item, level: 50, confidence: 0.5 });
      }
      return studentRepository.normalizeSkillEntry(item);
    }),
    topics: rawTopics.map((item) => {
      if (typeof item === 'string') {
        return studentRepository.normalizeTopicEntry({ name: item, score: 50, mastery: 'Developing' });
      }
      return studentRepository.normalizeTopicEntry(item);
    }),
    name: String(payload.name || '').trim(),
    phone: String(payload.phone || '').trim(),
    profilePhoto: String(payload.profilePhoto || '').trim(),
    dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth).toISOString().slice(0, 10) : null,
    gender: String(payload.gender || '').trim(),
    currentCity: String(payload.currentCity || '').trim(),
    state: String(payload.state || '').trim(),
    country: String(payload.country || '').trim(),
    linkedinUrl: String(payload.linkedinUrl || '').trim(),
    githubUrl: String(payload.githubUrl || '').trim(),
    portfolioUrl: String(payload.portfolioUrl || '').trim(),
    resumeFileUrl: String(payload.resumeFileUrl || '').trim(),
    resumeParsedData: payload.resumeParsedData || null,
    parsedSkills: Array.isArray(payload.parsedSkills) ? payload.parsedSkills : [],
    otherLinks: Array.isArray(payload.otherLinks) ? payload.otherLinks : [],
    topicScores: Array.isArray(payload.topicScores) ? payload.topicScores : [],
    projects: Array.isArray(payload.projects) ? payload.projects : [],
    internships: Array.isArray(payload.internships) ? payload.internships : [],
    certifications: Array.isArray(payload.certifications) ? payload.certifications : [],
    portfolio: payload.portfolio || {},
    skillProfile: payload.skillProfile || {
      summary: '',
      strengths: [],
      gaps: [],
    },
  };
}

function calculateProfileCompletion(profile) {
  const requirements = {
    personal: Boolean(profile.name && profile.phone && profile.currentCity),
    education: Boolean(profile.academicInfo && profile.academicInfo.university && profile.academicInfo.degree),
    resume: Boolean(profile.resumeFileUrl),
    skills: Array.isArray(profile.skills) && profile.skills.length > 0,
    projects: Array.isArray(profile.projects) && profile.projects.length > 0,
    links: Boolean(profile.linkedinUrl || profile.githubUrl),
  };
  
  const total = Object.keys(requirements).length;
  const completed = Object.values(requirements).filter(Boolean).length;
  const percentage = Math.round((completed / total) * 100);
  
  return {
    percentage,
    requirements,
    isComplete: percentage === 100
  };
}

function normalizeSkillsInput(payload = {}) {
  const skills = Array.isArray(payload.skills) ? payload.skills : [];
  return skills.map((skill) => {
    if (typeof skill === 'string') {
      return studentRepository.normalizeSkillEntry({ name: skill, level: 50, confidence: 0.5 });
    }
    return studentRepository.normalizeSkillEntry(skill);
  });
}

function normalizeTopicsInput(payload = {}) {
  const topics = Array.isArray(payload.topics) ? payload.topics : [];
  return topics.map((topic) => {
    if (typeof topic === 'string') {
      return studentRepository.normalizeTopicEntry({ name: topic, score: 50, mastery: 'Developing' });
    }
    return studentRepository.normalizeTopicEntry(topic);
  });
}

async function getStudentProfile(userId) {
  const profile = await studentRepository.getStudentProfile(userId);
  const sanitized = studentRepository.sanitizeProfile(profile);
  const completion = calculateProfileCompletion(sanitized);
  return { ...sanitized, completion };
}

async function updateStudentProfile(userId, payload = {}) {
  const safePayload = normalizeProfileInput(payload);

  if (!safePayload.targetRole && !safePayload.careerGoal && !safePayload.academicInfo.university && !safePayload.name && !safePayload.phone) {
    throw new AppError('Student profile update requires valid information.', 400);
  }

  const profile = await studentRepository.upsertStudentProfile(userId, safePayload);
  const sanitized = studentRepository.sanitizeProfile(profile);
  const completion = calculateProfileCompletion(sanitized);
  return { ...sanitized, completion };
}

async function updateProfilePhoto(userId, photoUrl) {
  const profile = await studentRepository.updateProfilePhoto(userId, photoUrl);
  const sanitized = studentRepository.sanitizeProfile(profile);
  const completion = calculateProfileCompletion(sanitized);
  return { ...sanitized, completion };
}

async function updateResumeFile(userId, resumeUrl, parsedData, parsedSkills) {
  const profile = await studentRepository.updateResumeFile(userId, resumeUrl, parsedData, parsedSkills);
  const sanitized = studentRepository.sanitizeProfile(profile);
  const completion = calculateProfileCompletion(sanitized);
  return { ...sanitized, completion };
}

async function getStudentDashboard(userId) {
  const profile = await studentRepository.getStudentProfile(userId);
  const dashboard = studentRepository.buildDashboard(profile);

  let skillGapSummary = null;

  try {
    skillGapSummary = skillGapService.analyzeSkillGap(profile);
  } catch (error) {
    skillGapSummary = {
      targetRole: profile.targetRole || 'Not specified',
      explainable: true,
      matchedSkills: [],
      partiallyMatchedSkills: [],
      skillGaps: [],
      topicGaps: [],
      priorityGaps: [],
      recommendedImprovementAreas: [],
      summary: {
        totalRequirements: 0,
        matchedCount: 0,
        partialCount: 0,
        gapCount: 0,
        readinessScore: 0,
      },
    };
  }

  return {
    userId,
    ...dashboard,
    skillGapSummary,
  };
}

async function getStudentSkills(userId) {
  const pool = getPool();
  const [profile, latestResult] = await Promise.all([
    studentRepository.getStudentProfile(userId),
    pool.query('SELECT skill_scores FROM assessment_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [Number(userId)]),
  ]);

  const rawAssessed = parseJsonValue(latestResult.rows[0]?.skill_scores);
  const assessedSkills = Array.isArray(rawAssessed) ? rawAssessed : [];

  return {
    userId,
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    selfDeclaredSkills: Array.isArray(profile.skills) ? profile.skills : [],
    assessedSkills,
    resumeDetectedSkills: Array.isArray(profile.parsedSkills) ? profile.parsedSkills : [],
  };
}

async function updateStudentSkills(userId, payload = {}) {
  const profile = await studentRepository.getStudentProfile(userId);
  const safeSkills = normalizeSkillsInput(payload);
  const updatedProfile = studentRepository.sanitizeProfile({
    ...profile,
    skills: safeSkills,
  });

  const saved = await studentRepository.upsertStudentProfile(userId, updatedProfile);
  return { userId, skills: saved.skills };
}

async function getStudentTopics(userId) {
  const profile = await studentRepository.getStudentProfile(userId);
  return {
    userId,
    topics: Array.isArray(profile.topics) ? profile.topics : [],
  };
}

async function updateStudentTopics(userId, payload = {}) {
  const profile = await studentRepository.getStudentProfile(userId);
  const safeTopics = normalizeTopicsInput(payload);
  const updatedProfile = studentRepository.sanitizeProfile({
    ...profile,
    topics: safeTopics,
    topicScores: safeTopics,
  });

  const saved = await studentRepository.upsertStudentProfile(userId, updatedProfile);
  return { userId, topics: saved.topics, topicScores: saved.topicScores };
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }

  return [];
}

function buildProjectEvaluation(project = {}, profile = {}) {
  const technologies = normalizeStringList(project.technologies || project.technologyStack || []);
  const contribution = String(project.studentContribution || project.contribution || '').trim();
  const description = String(project.description || project.summary || '').trim();
  const repo = String(project.githubUrl || project.link || '').trim();
  const demo = String(project.liveUrl || project.demoUrl || '').trim();
  const duration = String(project.duration || '').trim();

  const criteria = {
    technicalComplexity: Math.min(100, technologies.length * 12 + (description.length > 200 ? 20 : 8)),
    roleRelevance: Math.min(100, (profile.targetRole ? 45 : 0) + (technologies.length >= 2 ? 35 : 10) + (contribution ? 20 : 5)),
    problemSolving: Math.min(100, (contribution ? 40 : 0) + (description.length > 100 ? 30 : 15) + (duration ? 25 : 10)),
    implementationQuality: Math.min(100, (repo ? 35 : 0) + (demo ? 25 : 0) + (contribution ? 25 : 10) + (technologies.length >= 2 ? 15 : 5)),
    technologyUsage: Math.min(100, technologies.length * 18 + (repo ? 10 : 0)),
    completeness: Math.min(100, (description ? 30 : 0) + (duration ? 25 : 0) + (technologies.length ? 25 : 0) + (repo || demo ? 20 : 0)),
    documentation: Math.min(100, (repo ? 40 : 0) + (demo ? 20 : 0) + (description ? 25 : 0) + (project.screenshots?.length ? 15 : 0)),
    innovation: Math.min(100, (description.length > 200 ? 35 : 15) + (demo ? 20 : 0) + (technologies.length >= 3 ? 25 : 10) + (contribution ? 20 : 10)),
  };

  const weightedScore = Object.values(criteria).reduce((sum, value) => sum + value, 0) / Object.keys(criteria).length;

  return {
    criterionScores: criteria,
    overallScore: Math.round(weightedScore),
    strengths: [
      technologies.length ? 'Technology stack is clearly defined.' : 'Add a clearer stack to improve evidence quality.',
      contribution ? 'Student contribution is documented.' : 'Document the contribution to strengthen the evaluation.',
      repo || demo ? 'Project links provide evidence of implementation.' : 'Add repository or live demo links for stronger validation.',
    ].slice(0, 3),
    weaknesses: [
      !description ? 'Add a detailed project description.' : '',
      technologies.length < 2 ? 'Add more technologies to show breadth.' : '',
      !repo ? 'Repository evidence is missing.' : '',
    ].filter(Boolean),
    improvementSuggestions: [
      'Add more measurable impact statements.',
      'Document how the project solved a real problem.',
      'Include a live link or repository evidence where possible.',
    ],
    repositoryAnalysis: repo ? 'Repository evidence available.' : 'Repository analysis unavailable.',
  };
}

function buildInternshipEvaluation(internship = {}, profile = {}) {
  const responsibilities = normalizeStringList(internship.responsibilities || []);
  const skillsUsed = normalizeStringList(internship.skillsUsed || []);
  const duration = String(internship.duration || '').trim();
  const description = String(internship.description || '').trim();
  const company = String(internship.company || internship.companyName || '').trim();
  const role = String(internship.role || '').trim();

  const criteria = {
    roleRelevance: Math.min(100, (profile.targetRole ? 35 : 0) + (role ? 30 : 0) + (skillsUsed.length >= 2 ? 35 : 15)),
    duration: Math.min(100, duration ? 80 : 25),
    responsibilities: Math.min(100, responsibilities.length * 18 + (description ? 10 : 0)),
    skillsUsed: Math.min(100, skillsUsed.length * 22 + (skillsUsed.length ? 15 : 0)),
    practicalExposure: Math.min(100, (description ? 35 : 0) + (responsibilities.length >= 2 ? 35 : 15) + (company ? 30 : 10)),
    roleComplexity: Math.min(100, (responsibilities.length >= 3 ? 45 : 20) + (skillsUsed.length >= 2 ? 30 : 10) + (duration ? 25 : 10)),
  };

  const overallScore = Math.round(Object.values(criteria).reduce((sum, value) => sum + value, 0) / Object.keys(criteria).length);

  return {
    criterionScores: criteria,
    overallScore,
    strengths: [
      company ? `Experience at ${company} adds practical evidence.` : 'Add company context for stronger validation.',
      responsibilities.length ? 'Responsibilities are documented.' : 'Add detailed responsibilities to improve evidence.',
      skillsUsed.length ? 'Used skills are defined.' : 'List the core skills used in the internship.',
    ].slice(0, 3),
    weaknesses: [
      !description ? 'Add a detailed experience summary.' : '',
      !duration ? 'Specify the duration for better evaluation context.' : '',
      responsibilities.length < 2 ? 'Add more responsibility detail.' : '',
    ].filter(Boolean),
    improvementSuggestions: [
      'Describe the work in more measurable outcomes.',
      'Add more role-specific responsibilities and skills used.',
      'Include evidence such as certificates or project links where appropriate.',
    ],
    evidenceStatus: internship.evidence || internship.certificateUrl ? 'Evidence available.' : 'Evidence not yet provided.',
  };
}

function parseJsonValue(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return value;
    }
  }

  return value;
}

function convertProjectRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || row.summary || '',
    summary: row.summary || row.description || '',
    githubUrl: row.github_url || '',
    liveUrl: row.live_url || '',
    technologies: Array.isArray(row.technology_stack) ? row.technology_stack : [],
    studentContribution: row.student_contribution || '',
    duration: row.duration || '',
    status: row.status || 'draft',
    submittedAt: row.submitted_at || null,
    evaluation: row.evaluation ? parseJsonValue(row.evaluation) : null,
    createdAt: row.created_at,
  };
}

function convertInternshipRow(row) {
  return {
    id: row.id,
    company: row.company_name || '',
    role: row.role || '',
    duration: row.duration || '',
    status: row.status || 'draft',
    description: row.description || '',
    responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
    skillsUsed: Array.isArray(row.skills_used) ? row.skills_used : [],
    evidence: row.evidence || row.certificate_url || '',
    type: row.type || 'internship',
    submittedAt: row.submitted_at || null,
    evaluation: row.evaluation ? parseJsonValue(row.evaluation) : null,
    createdAt: row.created_at,
  };
}

function convertEducationRow(row) {
  return {
    id: row.id,
    institutionName: row.institution || '',
    degreeOrBoard: row.degree || '',
    branchOrStream: row.branch || '',
    startYear: row.start_year || '',
    endYear: row.end_year || '',
    scoreType: row.grading_scale || 'CGPA',
    score: row.cgpa || '',
    educationLevel: row.education_level || 'Undergraduate',
    createdAt: row.created_at,
  };
}

async function getStudentEducation(userId) {
  const pool = getPool();
  const rows = await pool.query(
    `SELECT * FROM education WHERE user_id = $1 ORDER BY start_year DESC, created_at DESC`,
    [Number(userId)],
  );
  return { userId, education: rows.rows.map(convertEducationRow) };
}

async function createStudentEducation(userId, payload = {}) {
  const input = {
    institutionName: String(payload.institutionName || '').trim(),
    degreeOrBoard: String(payload.degreeOrBoard || '').trim(),
    branchOrStream: String(payload.branchOrStream || '').trim(),
    startYear: String(payload.startYear || '').trim(),
    endYear: String(payload.endYear || '').trim(),
    scoreType: String(payload.scoreType || 'CGPA').trim(),
    score: String(payload.score || '').trim(),
    educationLevel: String(payload.educationLevel || 'Undergraduate').trim(),
  };

  if (!input.institutionName || !input.degreeOrBoard) {
    throw new AppError('Institution name and degree/board are required.', 400);
  }

  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO education (
      user_id, institution, degree, branch, start_year, end_year,
      grading_scale, cgpa, education_level, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING *`,
    [
      Number(userId),
      input.institutionName,
      input.degreeOrBoard,
      input.branchOrStream,
      input.startYear ? Number(input.startYear) : null,
      input.endYear ? Number(input.endYear) : null,
      input.scoreType,
      input.score ? Number(input.score) : null,
      input.educationLevel,
    ],
  );

  return { userId, education: convertEducationRow(result.rows[0]) };
}

async function updateStudentEducation(userId, educationId, payload = {}) {
  const pool = getPool();
  const current = await pool.query('SELECT * FROM education WHERE id = $1 AND user_id = $2', [educationId, Number(userId)]);

  if (!current.rows[0]) {
    throw new AppError('Education record not found.', 404);
  }

  const input = {
    institutionName: String(payload.institutionName || current.rows[0].institution || '').trim(),
    degreeOrBoard: String(payload.degreeOrBoard || current.rows[0].degree || '').trim(),
    branchOrStream: String(payload.branchOrStream || current.rows[0].branch || '').trim(),
    startYear: String(payload.startYear || current.rows[0].start_year || '').trim(),
    endYear: String(payload.endYear || current.rows[0].end_year || '').trim(),
    scoreType: String(payload.scoreType || current.rows[0].grading_scale || 'CGPA').trim(),
    score: String(payload.score || current.rows[0].cgpa || '').trim(),
    educationLevel: String(payload.educationLevel || current.rows[0].education_level || 'Undergraduate').trim(),
  };

  const result = await pool.query(
    `UPDATE education SET
      institution = $1,
      degree = $2,
      branch = $3,
      start_year = $4,
      end_year = $5,
      grading_scale = $6,
      cgpa = $7,
      education_level = $8,
      updated_at = NOW()
     WHERE id = $9 AND user_id = $10
     RETURNING *`,
    [
      input.institutionName,
      input.degreeOrBoard,
      input.branchOrStream,
      input.startYear ? Number(input.startYear) : null,
      input.endYear ? Number(input.endYear) : null,
      input.scoreType,
      input.score ? Number(input.score) : null,
      input.educationLevel,
      educationId,
      Number(userId),
    ],
  );

  return { userId, education: convertEducationRow(result.rows[0]) };
}

async function deleteStudentEducation(userId, educationId) {
  const pool = getPool();
  const result = await pool.query('DELETE FROM education WHERE id = $1 AND user_id = $2 RETURNING *', [educationId, Number(userId)]);
  if (!result.rows[0]) {
    throw new AppError('Education record not found.', 404);
  }
  return { userId, deleted: true, educationId };
}

async function getStudentProjects(userId) {
  const profile = await studentRepository.getStudentProfile(userId);
  const pool = getPool();

  const rows = await pool.query(
    `SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC`,
    [Number(userId)],
  );

  const projects = rows.rows.map(convertProjectRow);
  return { userId, projects: projects.length ? projects : Array.isArray(profile.projects) ? profile.projects : [] };
}

async function createProject(userId, payload = {}) {
  const projectInput = {
    title: String(payload.title || '').trim(),
    description: String(payload.description || payload.summary || '').trim(),
    summary: String(payload.summary || payload.description || '').trim(),
    githubUrl: String(payload.githubUrl || payload.link || '').trim(),
    link: String(payload.link || payload.githubUrl || '').trim(),
    liveUrl: String(payload.liveUrl || payload.demoUrl || '').trim(),
    demoUrl: String(payload.demoUrl || payload.liveUrl || '').trim(),
    technologies: normalizeStringList(payload.technologies || payload.technologyStack || []),
    studentContribution: String(payload.studentContribution || payload.contribution || '').trim(),
    duration: String(payload.duration || '').trim(),
    status: String(payload.status || 'draft').trim(),
    screenshots: Array.isArray(payload.screenshots) ? payload.screenshots : [],
  };

  if (!projectInput.title) {
    throw new AppError('Project title is required.', 400);
  }

  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO projects (
      user_id, title, summary, description, github_url, live_url, technology_stack, student_contribution,
      duration, status, submitted_at, evaluation, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NULL, NOW(), NOW())
    RETURNING *`,
    [
      Number(userId),
      projectInput.title,
      projectInput.summary,
      projectInput.description,
      projectInput.githubUrl,
      projectInput.liveUrl,
      JSON.stringify(projectInput.technologies),
      projectInput.studentContribution,
      projectInput.duration,
      projectInput.status,
    ],
  );

  const saved = convertProjectRow(result.rows[0]);

  const profile = await studentRepository.getStudentProfile(userId);
  const profileProjects = Array.isArray(profile.projects) ? profile.projects : [];
  const updatedProfile = studentRepository.sanitizeProfile({
    ...profile,
    projects: [...profileProjects, {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      summary: saved.summary,
      githubUrl: saved.githubUrl,
      liveUrl: saved.liveUrl,
      technologies: saved.technologies,
      studentContribution: saved.studentContribution,
      duration: saved.duration,
      status: saved.status,
      createdAt: saved.createdAt,
    }],
  });

  await studentRepository.upsertStudentProfile(userId, updatedProfile);
  return { userId, project: saved };
}

async function updateProject(userId, projectId, payload = {}) {
  const pool = getPool();
  const current = await pool.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [projectId, Number(userId)]);

  if (!current.rows[0]) {
    throw new AppError('Project not found.', 404);
  }

  const projectInput = {
    title: String(payload.title || current.rows[0].title || '').trim(),
    description: String(payload.description || payload.summary || current.rows[0].description || current.rows[0].summary || '').trim(),
    summary: String(payload.summary || payload.description || current.rows[0].summary || current.rows[0].description || '').trim(),
    githubUrl: String(payload.githubUrl || payload.link || current.rows[0].github_url || '').trim(),
    liveUrl: String(payload.liveUrl || payload.demoUrl || current.rows[0].live_url || '').trim(),
    technologies: normalizeStringList(payload.technologies || payload.technologyStack || current.rows[0].technology_stack || []),
    studentContribution: String(payload.studentContribution || payload.contribution || current.rows[0].student_contribution || '').trim(),
    duration: String(payload.duration || current.rows[0].duration || '').trim(),
    status: String(payload.status || current.rows[0].status || 'draft').trim(),
  };

  const result = await pool.query(
    `UPDATE projects SET
      title = $1,
      summary = $2,
      description = $3,
      github_url = $4,
      live_url = $5,
      technology_stack = $6,
      student_contribution = $7,
      duration = $8,
      status = $9,
      updated_at = NOW()
     WHERE id = $10 AND user_id = $11
     RETURNING *`,
    [
      projectInput.title,
      projectInput.summary,
      projectInput.description,
      projectInput.githubUrl,
      projectInput.liveUrl,
      JSON.stringify(projectInput.technologies),
      projectInput.studentContribution,
      projectInput.duration,
      projectInput.status,
      projectId,
      Number(userId),
    ],
  );

  return { userId, project: convertProjectRow(result.rows[0]) };
}

async function deleteProject(userId, projectId) {
  const pool = getPool();
  const result = await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING *', [projectId, Number(userId)]);
  if (!result.rows[0]) {
    throw new AppError('Project not found.', 404);
  }
  return { userId, deleted: true, projectId };
}

async function submitProjectForEvaluation(userId, projectId, payload = {}) {
  const project = await getStudentProjects(userId).then((data) => data.projects.find((item) => String(item.id) === String(projectId)));
  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  const profile = await studentRepository.getStudentProfile(userId);
  const evaluation = buildProjectEvaluation(project, profile);

  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO project_evaluations (id, project_id, evaluator_id, score, notes, technical_complexity, role_relevance, problem_solving, implementation_quality, technology_usage, completeness, documentation, innovation, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
     RETURNING *`,
    [
      require('node:crypto').randomUUID(),
      projectId,
      Number(userId),
      evaluation.overallScore,
      JSON.stringify({ strengths: evaluation.strengths, weaknesses: evaluation.weaknesses, suggestions: evaluation.improvementSuggestions }),
      evaluation.criterionScores.technicalComplexity,
      evaluation.criterionScores.roleRelevance,
      evaluation.criterionScores.problemSolving,
      evaluation.criterionScores.implementationQuality,
      evaluation.criterionScores.technologyUsage,
      evaluation.criterionScores.completeness,
      evaluation.criterionScores.documentation,
      evaluation.criterionScores.innovation,
    ],
  );

  await pool.query(
    `UPDATE projects SET status = 'submitted', evaluation = $2, submitted_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [projectId, JSON.stringify({ score: evaluation.overallScore, ...evaluation })],
  );

  return {
    projectId,
    submitted: true,
    evaluation: { score: evaluation.overallScore, criterionScores: evaluation.criterionScores, strengths: evaluation.strengths, weaknesses: evaluation.weaknesses, improvementSuggestions: evaluation.improvementSuggestions },
    repositoryAnalysis: evaluation.repositoryAnalysis,
  };
}

async function getStudentInternships(userId) {
  const profile = await studentRepository.getStudentProfile(userId);
  const pool = getPool();
  const rows = await pool.query(
    `SELECT * FROM internships WHERE user_id = $1 ORDER BY created_at DESC`,
    [Number(userId)],
  );

  const internships = rows.rows.map(convertInternshipRow);
  return { userId, internships: internships.length ? internships : Array.isArray(profile.internships) ? profile.internships : [] };
}

async function createInternship(userId, payload = {}) {
  const internshipInput = {
    company: String(payload.company || '').trim(),
    role: String(payload.role || '').trim(),
    duration: String(payload.duration || '').trim(),
    status: String(payload.status || 'draft').trim(),
    description: String(payload.description || '').trim(),
    responsibilities: normalizeStringList(payload.responsibilities || []),
    skillsUsed: normalizeStringList(payload.skillsUsed || []),
    evidence: String(payload.evidence || payload.certificateUrl || '').trim(),
    certificateUrl: String(payload.certificateUrl || payload.evidence || '').trim(),
    type: String(payload.type || 'internship').trim(),
  };

  if (!internshipInput.company || !internshipInput.role) {
    throw new AppError('Internship company and role are required.', 400);
  }

  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO internships (
      user_id, title, company_name, role, duration, description, responsibilities, skills_used,
      evidence, certificate_url, status, submitted_at, evaluation, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NULL, NOW(), NOW())
    RETURNING *`,
    [
      Number(userId),
      `${internshipInput.company} - ${internshipInput.role}`,
      internshipInput.company,
      internshipInput.role,
      internshipInput.duration,
      internshipInput.description,
      JSON.stringify(internshipInput.responsibilities),
      JSON.stringify(internshipInput.skillsUsed),
      internshipInput.evidence,
      internshipInput.certificateUrl,
      internshipInput.status,
    ],
  );

  const saved = convertInternshipRow(result.rows[0]);

  const profile = await studentRepository.getStudentProfile(userId);
  const internships = Array.isArray(profile.internships) ? profile.internships : [];
  const updatedProfile = studentRepository.sanitizeProfile({
    ...profile,
    internships: [...internships, {
      id: saved.id,
      company: saved.company,
      role: saved.role,
      duration: saved.duration,
      description: saved.description,
      responsibilities: saved.responsibilities,
      skillsUsed: saved.skillsUsed,
      evidence: saved.evidence,
      status: saved.status,
      createdAt: saved.createdAt,
    }],
  });

  await studentRepository.upsertStudentProfile(userId, updatedProfile);
  return { userId, internship: saved };
}

async function updateInternship(userId, internshipId, payload = {}) {
  const pool = getPool();
  const current = await pool.query('SELECT * FROM internships WHERE id = $1 AND user_id = $2', [internshipId, Number(userId)]);

  if (!current.rows[0]) {
    throw new AppError('Internship not found.', 404);
  }

  const internshipInput = {
    company: String(payload.company || current.rows[0].company_name || '').trim(),
    role: String(payload.role || current.rows[0].role || '').trim(),
    duration: String(payload.duration || current.rows[0].duration || '').trim(),
    description: String(payload.description || current.rows[0].description || '').trim(),
    responsibilities: normalizeStringList(payload.responsibilities || current.rows[0].responsibilities || []),
    skillsUsed: normalizeStringList(payload.skillsUsed || current.rows[0].skills_used || []),
    evidence: String(payload.evidence || payload.certificateUrl || current.rows[0].evidence || '').trim(),
    status: String(payload.status || current.rows[0].status || 'draft').trim(),
  };

  const result = await pool.query(
    `UPDATE internships SET
      title = $1,
      company_name = $2,
      role = $3,
      duration = $4,
      description = $5,
      responsibilities = $6,
      skills_used = $7,
      evidence = $8,
      status = $9,
      updated_at = NOW()
     WHERE id = $10 AND user_id = $11
     RETURNING *`,
    [
      `${internshipInput.company} - ${internshipInput.role}`,
      internshipInput.company,
      internshipInput.role,
      internshipInput.duration,
      internshipInput.description,
      JSON.stringify(internshipInput.responsibilities),
      JSON.stringify(internshipInput.skillsUsed),
      internshipInput.evidence,
      internshipInput.status,
      internshipId,
      Number(userId),
    ],
  );

  return { userId, internship: convertInternshipRow(result.rows[0]) };
}

async function deleteInternship(userId, internshipId) {
  const pool = getPool();
  const result = await pool.query('DELETE FROM internships WHERE id = $1 AND user_id = $2 RETURNING *', [internshipId, Number(userId)]);
  if (!result.rows[0]) {
    throw new AppError('Internship not found.', 404);
  }
  return { userId, deleted: true, internshipId };
}

async function submitInternshipForEvaluation(userId, internshipId) {
  const internship = await getStudentInternships(userId).then((data) => data.internships.find((item) => String(item.id) === String(internshipId)));
  if (!internship) {
    throw new AppError('Internship not found.', 404);
  }

  const profile = await studentRepository.getStudentProfile(userId);
  const evaluation = buildInternshipEvaluation(internship, profile);
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO internship_evaluations (id, internship_id, evaluator_id, score, notes, role_relevance, duration, responsibilities, skills_used, practical_exposure, role_complexity, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
     RETURNING *`,
    [
      require('node:crypto').randomUUID(),
      internshipId,
      Number(userId),
      evaluation.overallScore,
      JSON.stringify({ strengths: evaluation.strengths, weaknesses: evaluation.weaknesses, suggestions: evaluation.improvementSuggestions }),
      evaluation.criterionScores.roleRelevance,
      evaluation.criterionScores.duration,
      evaluation.criterionScores.responsibilities,
      evaluation.criterionScores.skillsUsed,
      evaluation.criterionScores.practicalExposure,
      evaluation.criterionScores.roleComplexity,
    ],
  );

  await pool.query(
    `UPDATE internships SET status = 'submitted', evaluation = $2, submitted_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [internshipId, JSON.stringify({ score: evaluation.overallScore, ...evaluation })],
  );

  return {
    internshipId,
    submitted: true,
    evaluation: { score: evaluation.overallScore, criterionScores: evaluation.criterionScores, strengths: evaluation.strengths, weaknesses: evaluation.weaknesses, improvementSuggestions: evaluation.improvementSuggestions },
    evidenceStatus: evaluation.evidenceStatus,
  };
}

async function getStudentDashboard(userId) {
  const profile = await studentRepository.getStudentProfile(userId);
  const dashboard = studentRepository.buildDashboard(profile);

  let skillGapSummary = null;

  try {
    skillGapSummary = skillGapService.analyzeSkillGap(profile);
  } catch (error) {
    skillGapSummary = {
      targetRole: profile.targetRole || 'Not specified',
      explainable: true,
      matchedSkills: [],
      partiallyMatchedSkills: [],
      skillGaps: [],
      topicGaps: [],
      priorityGaps: [],
      recommendedImprovementAreas: [],
      summary: {
        totalRequirements: 0,
        matchedCount: 0,
        partialCount: 0,
        gapCount: 0,
        readinessScore: 0,
      },
    };
  }

  const pool = getPool();
  const [projectsResult, internshipsResult, latestAttempt, latestResult] = await Promise.all([
    pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [Number(userId)]),
    pool.query('SELECT * FROM internships WHERE user_id = $1 ORDER BY created_at DESC', [Number(userId)]),
    pool.query(
      'SELECT * FROM assessment_attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [Number(userId)],
    ),
    pool.query(
      'SELECT * FROM assessment_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [Number(userId)],
    ),
  ]);

  const technicalScore = Number(latestAttempt.rows[0]?.technical_score ?? latestResult.rows[0]?.technical_test_score ?? 0);
  const projectEvaluations = projectsResult.rows
    .filter((project) => project.evaluation)
    .map((project) => parseJsonValue(project.evaluation));
  const internshipEvaluations = internshipsResult.rows
    .filter((internship) => internship.evaluation)
    .map((internship) => parseJsonValue(internship.evaluation));
  const projectScore = projectEvaluations.length ? Math.round(projectEvaluations.reduce((sum, item) => sum + Number(item?.score || 0), 0) / projectEvaluations.length) : 0;
  const internshipScore = internshipEvaluations.length ? Math.round(internshipEvaluations.reduce((sum, item) => sum + Number(item?.score || 0), 0) / internshipEvaluations.length) : 0;
  const overallScore = Math.round((technicalScore * 0.5) + (projectScore * 0.3) + (internshipScore * 0.2));

  const rawAssessedSkills = parseJsonValue(latestResult.rows[0]?.skill_scores);
  const assessedSkills = Array.isArray(rawAssessedSkills) ? rawAssessedSkills : [];

  return {
    userId,
    ...dashboard,
    skillGapSummary,
    assessmentStatus: latestAttempt.rows[0]?.status || 'Not Started',
    projects: projectsResult.rows.map(convertProjectRow),
    internships: internshipsResult.rows.map(convertInternshipRow),
    technicalScore,
    projectScore,
    internshipScore,
    overallScore,
    currentRank: 0,
    targetRole: profile.targetRole || dashboard.targetRole,
    selfDeclaredSkills: Array.isArray(profile.skills) ? profile.skills : [],
    assessedSkills: assessedSkills.length ? assessedSkills : [],
    resumeDetectedSkills: Array.isArray(profile.parsedSkills) ? profile.parsedSkills : [],
    skillBreakdown: assessedSkills.length ? assessedSkills : dashboard.skillOverview,
    completion: calculateProfileCompletion(profile),
  };
}

async function getStudentCertifications(userId) {
  const profile = await studentRepository.getStudentProfile(userId);
  return { userId, certifications: Array.isArray(profile.certifications) ? profile.certifications : [] };
}

async function createCertification(userId, payload = {}) {
  const profile = await studentRepository.getStudentProfile(userId);
  const entry = {
    id: Date.now(),
    name: String(payload.name || '').trim(),
    issuer: String(payload.issuer || '').trim(),
    year: payload.year ?? new Date().getFullYear(),
    credentialUrl: String(payload.credentialUrl || '').trim(),
    createdAt: new Date().toISOString(),
  };

  if (!entry.name || !entry.issuer) {
    throw new AppError('Certification name and issuer are required.', 400);
  }

  const updatedProfile = studentRepository.sanitizeProfile({
    ...profile,
    certifications: [...(Array.isArray(profile.certifications) ? profile.certifications : []), entry],
  });

  const saved = await studentRepository.upsertStudentProfile(userId, updatedProfile);
  return { userId, certification: saved.certifications[saved.certifications.length - 1] };
}

async function getStudentPortfolio(userId) {
  const profile = await studentRepository.getStudentProfile(userId);
  return {
    userId,
    portfolio: {
      ...studentRepository.sanitizeProfile(profile).portfolio,
      targetRole: profile.targetRole || '',
      academicInfo: profile.academicInfo || {},
      skills: profile.skills || [],
      topics: profile.topics || [],
      projects: profile.projects || [],
      internships: profile.internships || [],
      certifications: profile.certifications || [],
    },
  };
}

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  updateProfilePhoto,
  updateResumeFile,
  getStudentDashboard,
  getStudentSkills,
  updateStudentSkills,
  getStudentTopics,
  updateStudentTopics,
  getStudentEducation,
  createStudentEducation,
  updateStudentEducation,
  deleteStudentEducation,
  getStudentProjects,
  createProject,
  updateProject,
  deleteProject,
  submitProjectForEvaluation,
  getStudentInternships,
  createInternship,
  updateInternship,
  deleteInternship,
  submitInternshipForEvaluation,
  getStudentCertifications,
  createCertification,
  getStudentPortfolio,
};
