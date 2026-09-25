import { withCache, removeCache, CACHE_TTL } from '../utils/cache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function oppsRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error?.message || 'Request failed.');
  }

  return payload;
}

export function clearOpportunitiesCache() {
  removeCache('opportunities_active');
  removeCache('opportunities_industry');
}

export async function fetchActiveOpportunities(forceRefresh = false, onBackgroundUpdate = null) {
  return withCache('opportunities_active', () => oppsRequest('/opportunities/active'), CACHE_TTL.OPPORTUNITIES, forceRefresh, onBackgroundUpdate, false);
}

export async function fetchOpportunityDetails(id, onBackgroundUpdate = null) {
  return withCache(`opportunity_${id}`, () => oppsRequest(`/opportunities/${id}`), CACHE_TTL.OPPORTUNITIES, false, onBackgroundUpdate, false);
}

export async function applyForOpportunity(id) {
  clearOpportunitiesCache();
  removeCache(`opportunity_${id}`);
  removeCache('applications_student');
  removeCache('dashboard'); // applying affects readiness/dashboard
  return oppsRequest(`/opportunities/${id}/apply`, {
    method: 'POST'
  });
}

export async function fetchStudentApplications(onBackgroundUpdate = null) {
  return withCache('applications_student', () => oppsRequest('/applications/student'), CACHE_TTL.APPLICATIONS, false, onBackgroundUpdate);
}

export async function fetchIndustryOpportunities(onBackgroundUpdate = null) {
  return withCache('opportunities_industry', () => oppsRequest('/opportunities/industry'), CACHE_TTL.OPPORTUNITIES, false, onBackgroundUpdate);
}

export async function createOpportunity(data) {
  clearOpportunitiesCache();
  return oppsRequest('/opportunities', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateOpportunityStatus(id, status) {
  clearOpportunitiesCache();
  removeCache(`opportunity_${id}`);
  return oppsRequest(`/opportunities/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function fetchOpportunityApplications(id, onBackgroundUpdate = null) {
  return withCache(`opportunity_${id}_applications`, () => oppsRequest(`/opportunities/${id}/applications`), CACHE_TTL.APPLICATIONS, false, onBackgroundUpdate);
}

export async function updateApplicationStatus(oppId, appId, status) {
  removeCache(`opportunity_${oppId}_applications`);
  // Note: Since this is likely done by industry/admin, student cache is separate and will expire based on TTL.
  return oppsRequest(`/opportunities/${oppId}/applications/${appId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function fetchNotifications(unread = false, onBackgroundUpdate = null) {
  const cacheKey = `notifications_unread_${unread}`;
  return withCache(cacheKey, () => oppsRequest(`/notifications?unread=${unread}`), CACHE_TTL.NOTIFICATIONS, false, onBackgroundUpdate);
}

export async function markNotificationRead(id) {
  removeCache(`notifications_unread_false`);
  removeCache(`notifications_unread_true`);
  return oppsRequest(`/notifications/${id}/read`, {
    method: 'PATCH'
  });
}
