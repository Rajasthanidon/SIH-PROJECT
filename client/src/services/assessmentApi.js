import { withCache, CACHE_TTL } from '../utils/cache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function assessmentRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/assessments${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Assessment request failed.');
  }

  return payload;
}

export async function fetchAssessmentRoles(onBackgroundUpdate = null) {
  return withCache('assessment_roles', () => assessmentRequest('/roles'), CACHE_TTL.STATIC, false, onBackgroundUpdate, false);
}

export async function fetchAvailableSkills(search = '', forceRefresh = false, onBackgroundUpdate = null) {
  const query = search ? `?q=${encodeURIComponent(search)}` : '';
  const key = `assessment_skills_${search || 'all'}`;
  return withCache(key, () => assessmentRequest(`/skills${query}`), CACHE_TTL.STATIC, forceRefresh, onBackgroundUpdate, false);
}

export async function fetchSkillTopics(skillName, onBackgroundUpdate = null) {
  return withCache(`assessment_topics_${skillName}`, () => assessmentRequest(`/skills/${encodeURIComponent(skillName)}/topics`), CACHE_TTL.STATIC, false, onBackgroundUpdate, false);
}

export async function fetchRoleDetails(roleName, onBackgroundUpdate = null) {
  return withCache(`assessment_role_${roleName}`, () => assessmentRequest(`/roles/${encodeURIComponent(roleName)}`), CACHE_TTL.STATIC, false, onBackgroundUpdate, false);
}

export async function startAssessment(payload) {
  return assessmentRequest('/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitAssessment(assessmentId, answers) {
  // Clear any relevant caches if submit affects skills (handled in component typically)
  return assessmentRequest(`/${assessmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function fetchAssessmentResult(assessmentId, onBackgroundUpdate = null) {
  const result = await withCache(`assessment_result_${assessmentId}`, () => assessmentRequest(`/${assessmentId}/result`), CACHE_TTL.DASHBOARD, false, onBackgroundUpdate, true);
  return result.result || result; // Because it returns { result: {...} } in API, wait, withCache returns whatever API returns.
}

export async function fetchAssessmentLeaderboard(onBackgroundUpdate = null) {
  return withCache('assessment_leaderboard', () => assessmentRequest('/leaderboard'), CACHE_TTL.DASHBOARD, false, onBackgroundUpdate, false);
}

export async function fetchCurrentAssessmentRank(onBackgroundUpdate = null) {
  const result = await withCache('assessment_rank', () => assessmentRequest('/rank'), CACHE_TTL.DASHBOARD, false, onBackgroundUpdate, true);
  return result.rank || result;
}
