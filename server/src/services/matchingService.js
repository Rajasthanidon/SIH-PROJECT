const AppError = require('../utils/AppError');
const studentRepository = require('../repositories/student.repository');
const industryRepository = require('../repositories/industry.repository');
const { findUserById } = require('../repositories/user.repository');
const { resolveRoleRequirements } = require('./skillGapService');

function normalizeLabel(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeList(value = []) {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set();
  const ordered = [];

  value.forEach((entry) => {
    let text = '';

    if (typeof entry === 'string') {
      text = entry;
    } else if (entry && typeof entry === 'object') {
      text = entry.name || entry.title || entry.skill || '';
    }

    const trimmed = String(text || '').trim();
    if (!trimmed) {
      return;
    }

    const normalized = normalizeLabel(trimmed);
    if (!normalized || unique.has(normalized)) {
      return;
    }

    unique.add(normalized);
    ordered.push(trimmed);
  });

  return ordered;
}

function pickScore(entry = {}) {
  const value = Number(entry.level ?? entry.score ?? entry.value ?? entry.mastery ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function buildLookup(profile = {}, includeTopics = true) {
  const entries = [
    ...(Array.isArray(profile.skills) ? profile.skills : []),
    ...(includeTopics ? (Array.isArray(profile.topics) ? profile.topics : []) : []),
    ...(Array.isArray(profile.topicScores) ? profile.topicScores : []),
  ];

  const map = new Map();

  entries.forEach((entry) => {
    const name = normalizeLabel(entry?.name || entry?.skill || '');
    if (!name) {
      return;
    }

    map.set(name, Math.max(map.get(name) || 0, pickScore(entry)));
  });

  return map;
}

function evaluateRequirementSet(candidateMap, requirementNames = [], minimumProficiency = 70, label = 'skill') {
  const requirements = normalizeList(requirementNames);

  const results = requirements.map((name) => {
    const current = candidateMap.get(normalizeLabel(name)) ?? 0;
    const threshold = Number(minimumProficiency || 70);
    let status = 'gap';

    if (current >= threshold) {
      status = 'matched';
    } else if (current >= threshold * 0.8) {
      status = 'partial';
    }

    const explanation = status === 'matched'
      ? `${name}: ${current}% meets the required ${threshold}% threshold for ${label}.`
      : status === 'partial'
        ? `${name}: ${current}% is close to the ${threshold}% target, but still needs focused improvement.`
        : `${name}: ${current}% remains below the required ${threshold}% threshold and is a missing requirement.`;

    return {
      name,
      current,
      required: threshold,
      status,
      explanation,
    };
  });

  const averageCurrent = results.length
    ? results.reduce((sum, item) => sum + item.current, 0) / results.length
    : 0;

  return {
    results,
    matched: results.filter((item) => item.status === 'matched').map((item) => item.name),
    partial: results.filter((item) => item.status === 'partial').map((item) => item.name),
    gap: results.filter((item) => item.status === 'gap').map((item) => item.name),
    averageCurrent,
  };
}

function evaluateEvidenceScore(profile = {}, requiredSkills = [], requiredTopics = []) {
  const profileText = [
    ...(Array.isArray(profile.skills) ? profile.skills : []).map((item) => (typeof item === 'string' ? item : item.name || item.title || item.description || '')),
    ...(Array.isArray(profile.topics) ? profile.topics : []).map((item) => (typeof item === 'string' ? item : item.name || item.title || item.description || '')),
    ...(Array.isArray(profile.projects) ? profile.projects : []).map((item) => (typeof item === 'string' ? item : item.name || item.title || item.description || '')),
    ...(Array.isArray(profile.internships) ? profile.internships : []).map((item) => (typeof item === 'string' ? item : item.name || item.title || item.description || '')),
    ...(Array.isArray(profile.certifications) ? profile.certifications : []).map((item) => (typeof item === 'string' ? item : item.name || item.title || item.description || '')),
    ...(Array.isArray(profile.portfolio?.highlights) ? profile.portfolio.highlights : []),
    ...(Array.isArray(profile.skillProfile?.strengths) ? profile.skillProfile.strengths : []),
  ].join(' ').toLowerCase();

  const keywords = [...new Set([...requiredSkills, ...requiredTopics].map((item) => normalizeLabel(item)))].filter(Boolean);
  const matchCount = keywords.reduce((count, keyword) => count + (profileText.includes(keyword) ? 1 : 0), 0);
  const projectCount = Array.isArray(profile.projects) ? profile.projects.length : 0;
  const internshipCount = Array.isArray(profile.internships) ? profile.internships.length : 0;
  const certificationCount = Array.isArray(profile.certifications) ? profile.certifications.length : 0;

  const evidenceScore = Math.min(
    100,
    Math.round((matchCount * 6) + (projectCount * 18) + (internshipCount * 12) + (certificationCount * 8)),
  );

  return {
    evidenceScore,
    profileText,
    matchedRequirements: keywords.filter((keyword) => profileText.includes(keyword)),
  };
}

function evaluateEligibility(candidateProfile = {}, opportunity = {}) {
  const minimumProficiency = Number(opportunity.minimumProficiency ?? opportunity.minimum_proficiency ?? 70);
  const requiredSkills = normalizeList(opportunity.requiredSkills || []);
  const skillMap = buildLookup(candidateProfile, true);
  const skillAverage = requiredSkills.length
    ? requiredSkills.reduce((sum, skill) => sum + (skillMap.get(normalizeLabel(skill)) ?? 0), 0) / requiredSkills.length
    : 0;

  const profileText = [
    candidateProfile.targetRole || '',
    candidateProfile.careerGoal || '',
    ...(Array.isArray(candidateProfile.projects) ? candidateProfile.projects.map((item) => (typeof item === 'string' ? item : item.name || '')) : []),
    ...(Array.isArray(candidateProfile.internships) ? candidateProfile.internships.map((item) => (typeof item === 'string' ? item : item.name || '')) : []),
    ...(Array.isArray(candidateProfile.certifications) ? candidateProfile.certifications.map((item) => (typeof item === 'string' ? item : item.name || '')) : []),
    ...(Array.isArray(candidateProfile.skillProfile?.strengths) ? candidateProfile.skillProfile.strengths : []),
  ].join(' ').toLowerCase();

  const eligibilityText = String(opportunity.eligibility || '').toLowerCase();
  const hasRelevantEvidence = profileText.length > 0 && (
    candidateProfile.projects?.length > 0 ||
    candidateProfile.internships?.length > 0 ||
    candidateProfile.certifications?.length > 0
  );

  let eligibilityStatus = 'eligible';

  if (skillAverage < minimumProficiency) {
    eligibilityStatus = 'not-eligible';
  } else if (eligibilityText && !profileText.includes(normalizeLabel(eligibilityText))) {
    const matchFragments = eligibilityText
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 5);

    const tokens = matchFragments.map((word) => word.toLowerCase());
    const hasKeywordMatch = tokens.some((token) => profileText.includes(token));

    if (!hasKeywordMatch) {
      eligibilityStatus = 'conditional';
    }
  }

  if (!hasRelevantEvidence) {
    eligibilityStatus = 'not-eligible';
  }

  return {
    eligibilityStatus,
    skillAverage,
    hasRelevantEvidence,
  };
}

function buildExplanation(skillResults, topicResults, evidenceScore, eligibilityStatus, opportunity = {}) {
  const lines = [];

  [...skillResults.results, ...topicResults.results].forEach((item) => {
    lines.push(item.explanation);
  });

  if (eligibilityStatus === 'eligible') {
    lines.push(`Eligibility check: candidate meets the opportunity requirements and has documented project or internship evidence.`);
  } else if (eligibilityStatus === 'conditional') {
    lines.push(`Eligibility check: partial evidence exists, but the candidate should confirm the documented experience requirements before shortlisting.`);
  } else {
    lines.push(`Eligibility check: minimum proficiency or evidence requirements are not satisfied for this opportunity.`);
  }

  lines.push(`Evidence score: ${evidenceScore}% based on profile projects, internships, certifications, and aligned requirement coverage.`);
  lines.push(`Opportunity requirement notes: ${String(opportunity.eligibility || 'No additional requirements specified.').trim() || 'No additional requirements specified.'}`);

  return lines;
}

function computeOpportunityMatch(candidateProfile = {}, opportunity = {}) {
  if (!candidateProfile || !candidateProfile.userId) {
    throw new AppError('Candidate profile could not be loaded.', 404);
  }

  if (!opportunity || !opportunity.id) {
    throw new AppError('Opportunity not found.', 404);
  }

  const requiredSkills = normalizeList(opportunity.requiredSkills || []);
  const requiredTopics = normalizeList(opportunity.requiredTopics || []);
  const minimumProficiency = Number(opportunity.minimumProficiency ?? opportunity.minimum_proficiency ?? 70);
  const skillMap = buildLookup(candidateProfile, true);
  const topicMap = buildLookup(candidateProfile, true);

  const skillAnalysis = evaluateRequirementSet(skillMap, requiredSkills, minimumProficiency, 'skill');
  const topicAnalysis = evaluateRequirementSet(topicMap, requiredTopics, minimumProficiency, 'topic');

  const evidence = evaluateEvidenceScore(candidateProfile, requiredSkills, requiredTopics);
  const eligibility = evaluateEligibility(candidateProfile, opportunity);
  const score = Math.round(
    (skillAnalysis.averageCurrent + topicAnalysis.averageCurrent + evidence.evidenceScore + (eligibility.eligibilityStatus === 'eligible' ? 100 : eligibility.eligibilityStatus === 'conditional' ? 70 : 0)) / 4,
  );

  const match = {
    score,
    skillMatch: {
      matched: skillAnalysis.matched,
      partial: skillAnalysis.partial,
      gap: skillAnalysis.gap,
      averageCurrent: skillAnalysis.averageCurrent,
    },
    topicMatch: {
      matched: topicAnalysis.matched,
      partial: topicAnalysis.partial,
      gap: topicAnalysis.gap,
      averageCurrent: topicAnalysis.averageCurrent,
    },
    eligibilityStatus: eligibility.eligibilityStatus,
    strengths: [
      ...skillAnalysis.matched,
      ...topicAnalysis.matched,
    ].slice(0, 6),
    skillGaps: skillAnalysis.gap.length ? skillAnalysis.gap : topicAnalysis.gap,
    missingRequirements: [...new Set([...skillAnalysis.gap, ...topicAnalysis.gap])],
    evidenceScore: evidence.evidenceScore,
    explanation: buildExplanation(skillAnalysis, topicAnalysis, evidence.evidenceScore, eligibility.eligibilityStatus, opportunity),
  };

  return match;
}

async function getOpportunityMatch(candidateId, opportunityId) {
  const candidateProfile = await studentRepository.getStudentProfile(candidateId);
  const opportunity = await industryRepository.getOpportunityById(opportunityId);

  if (!candidateProfile || !candidateProfile.userId) {
    throw new AppError('Candidate profile not found.', 404);
  }

  if (!opportunity) {
    throw new AppError('Opportunity not found.', 404);
  }

  const match = computeOpportunityMatch(candidateProfile, opportunity);

  return {
    candidateId: Number(candidateId),
    opportunityId,
    match,
  };
}

async function rankCandidatesForOpportunity(opportunityId, filters = {}) {
  const opportunity = await industryRepository.getOpportunityById(opportunityId);

  if (!opportunity) {
    throw new AppError('Opportunity not found.', 404);
  }

  const filtered = [];

  for (const [key, profile] of studentRepository.memoryStudentProfiles.entries()) {
    const user = await findUserById(key);

    if (!user || user.role !== 'student') {
      continue;
    }

    if (filters.skill) {
      const skillNames = (Array.isArray(profile.skills) ? profile.skills : []).map((item) => normalizeLabel(typeof item === 'string' ? item : item?.name || ''));
      const hasSkill = skillNames.some((item) => item.includes(normalizeLabel(filters.skill)));
      if (!hasSkill) {
        continue;
      }
    }

    const match = computeOpportunityMatch(profile, opportunity);

    if (filters.minScore && match.score < Number(filters.minScore)) {
      continue;
    }

    filtered.push({
      userId: Number(key),
      name: user.name,
      email: user.email,
      match,
    });
  }

  return filtered.sort((a, b) => b.match.score - a.match.score);
}

async function getStudentRecommendations(userId) {
  const profile = await studentRepository.getStudentProfile(userId);
  const targetRole = String(profile.targetRole || '').trim();
  const requirements = resolveRoleRequirements(targetRole) || [];

  const skillMap = buildLookup(profile, true);
  const recommendations = [];

  const prioritized = requirements.length
    ? requirements
        .map((requirement) => {
          const current = skillMap.get(normalizeLabel(requirement.name)) ?? 0;
          const gap = Math.max(0, Number(requirement.required ?? 70) - current);
          return {
            ...requirement,
            current,
            gap,
          };
        })
        .filter((item) => item.gap > 0)
        .sort((a, b) => b.gap - a.gap)
    : (Array.isArray(profile.skills) ? profile.skills : [])
        .map((skill) => ({
          name: String(skill.name || '').trim(),
          required: Number(skill.level ?? 0) + 10,
          current: Number(skill.level ?? 0),
          gap: Math.max(0, Number(skill.level ?? 0) + 10 - Number(skill.level ?? 0)),
        }))
        .filter((item) => item.name);

  prioritized.slice(0, 3).forEach((requirement, index) => {
    recommendations.push({
      title: `Strengthen ${requirement.name} for ${targetRole || 'your target role'}`,
      focus: requirement.name,
      current: Number(requirement.current || 0),
      target: Number(requirement.required || 80),
      action: `Add one project, internship outcome, or assessment that demonstrates ${requirement.name} with a measurable score above ${Math.max(70, Number(requirement.required || 80))}.`,
      reason: `Your ${requirement.name} score is ${Number(requirement.current || 0)} and is ${Math.max(0, Number(requirement.required || 70) - (Number(requirement.current || 0)))} points below the target benchmark.`,
      priority: index + 1,
    });
  });

  if (!recommendations.length) {
    recommendations.push({
      title: 'Document and validate your strongest evidence',
      focus: 'portfolio',
      current: 0,
      target: 80,
      action: 'Highlight your top projects and certifications with measurable outcomes and link them to the skills most relevant to your target role.',
      reason: 'No critical gaps were detected in the current profile, so the next strongest step is to document evidence more clearly.',
      priority: 1,
    });
  }

  return recommendations;
}

module.exports = {
  computeOpportunityMatch,
  getOpportunityMatch,
  rankCandidatesForOpportunity,
  getStudentRecommendations,
};
