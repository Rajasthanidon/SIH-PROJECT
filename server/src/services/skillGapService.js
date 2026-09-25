const AppError = require('../utils/AppError');
const { TARGET_ROLE_REQUIREMENTS } = require('../constants/targetRoleRequirements');
const skillGapRepository = require('../repositories/skillGap.repository');

function normalizeRoleName(roleName = '') {
  return String(roleName).trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ');
}

function resolveRoleRequirements(targetRole) {
  const normalized = normalizeRoleName(targetRole);

  if (!normalized) {
    return null;
  }

  if (TARGET_ROLE_REQUIREMENTS[normalized]) {
    return TARGET_ROLE_REQUIREMENTS[normalized];
  }

  const match = Object.keys(TARGET_ROLE_REQUIREMENTS).find((role) => normalized.includes(role) || role.includes(normalized));
  return match ? TARGET_ROLE_REQUIREMENTS[match] : null;
}

function findCurrentValue(profile, requirementName) {
  const requirementKey = normalizeRoleName(requirementName);
  const skillEntries = Array.isArray(profile.skills) ? profile.skills : [];
  const topicEntries = Array.isArray(profile.topics) ? profile.topics : [];
  const topicScores = Array.isArray(profile.topicScores) ? profile.topicScores : [];

  const lookup = new Map();

  [...skillEntries, ...topicEntries, ...topicScores].forEach((entry) => {
    const name = String(entry?.name || '').trim();
    if (!name) {
      return;
    }

    const normalized = normalizeRoleName(name);
    const value = Number(entry?.level ?? entry?.score ?? entry?.value ?? 0);

    if (Number.isFinite(value)) {
      lookup.set(normalized, value);
    }
  });

  return lookup.get(requirementKey) ?? 0;
}

function buildReason(current, required, gap, status) {
  if (status === 'matched') {
    return `Current performance exceeds the target requirement by ${Math.max(0, current - required)} points.`;
  }

  if (status === 'partially-matched') {
    return `You are ${Math.max(0, required - current)} points below the target requirement and should close this gap with focused practice.`;
  }

  return `This skill is ${Math.max(0, required - current)} points below the target threshold and should be prioritized first.`;
}

function analyzeSkillGap(profile = {}) {
  const targetRole = String(profile.targetRole || '').trim();
  const requirements = resolveRoleRequirements(targetRole);

  if (!targetRole || !requirements) {
    throw new AppError('A target role and mapped role requirements are required to analyze skill gaps.', 400);
  }

  const matchedSkills = [];
  const partiallyMatchedSkills = [];
  const skillGaps = [];
  const topicGaps = [];
  const priorityGaps = [];

  requirements.forEach((requirement) => {
    const current = findCurrentValue(profile, requirement.name);
    const required = Number(requirement.required ?? 0);
    const gap = Math.max(0, required - current);

    const item = {
      name: requirement.name,
      required,
      current,
      gap,
      status: current >= required ? 'matched' : current >= required * 0.8 ? 'partially-matched' : 'gap',
      reason: buildReason(current, required, gap, current >= required ? 'matched' : current >= required * 0.8 ? 'partially-matched' : 'gap'),
      type: requirement.category || 'skill',
    };

    if (item.status === 'matched') {
      matchedSkills.push(item);
      return;
    }

    if (item.status === 'partially-matched') {
      partiallyMatchedSkills.push(item);
      return;
    }

    skillGaps.push(item);
    priorityGaps.push({
      ...item,
      priority: gap >= 25 ? 'Critical' : gap >= 15 ? 'High' : 'Medium',
      action: `Increase ${requirement.name} proficiency to ${required} by practicing targeted exercises and adding project evidence.`,
    });

    topicGaps.push({
      name: requirement.name,
      current,
      required,
      gap,
      reason: item.reason,
      priority: gap >= 25 ? 'Critical' : gap >= 15 ? 'High' : 'Medium',
    });
  });

  priorityGaps.sort((a, b) => b.gap - a.gap);

  const recommendedImprovementAreas = priorityGaps.slice(0, 3).map((item, index) => ({
    rank: index + 1,
    name: item.name,
    objective: `Reach ${item.required} in ${item.name}`,
    action: item.action,
    reason: item.reason,
    priority: item.priority,
  }));

  const analysis = {
    targetRole,
    explainable: true,
    matchedSkills,
    partiallyMatchedSkills,
    skillGaps,
    topicGaps,
    priorityGaps,
    recommendedImprovementAreas,
    summary: {
      totalRequirements: requirements.length,
      matchedCount: matchedSkills.length,
      partialCount: partiallyMatchedSkills.length,
      gapCount: skillGaps.length,
      readinessScore: Math.max(0, Math.min(100, Math.round((matchedSkills.length / Math.max(requirements.length, 1)) * 100))),
    },
  };

  return analysis;
}

async function getSkillGapAnalysisForUser(userId, profile = {}) {
  const analysis = analyzeSkillGap(profile);
  await skillGapRepository.saveSkillGapAnalysis(userId, analysis);
  return analysis;
}

module.exports = {
  analyzeSkillGap,
  getSkillGapAnalysisForUser,
  resolveRoleRequirements,
};
