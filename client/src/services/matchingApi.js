const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function matchingRequest(path, options = {}) {
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
    throw new Error(payload?.error?.message || 'Matching request failed.');
  }

  return payload;
}

export async function fetchCandidateOpportunityMatch(candidateId, opportunityId) {
  return matchingRequest(`/matching/candidate/${candidateId}/opportunity/${opportunityId}`);
}

export async function fetchOpportunityCandidates(opportunityId, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const query = params.toString();
  return matchingRequest(`/matching/opportunity/${opportunityId}/candidates${query ? `?${query}` : ''}`);
}

export async function fetchStudentRecommendations() {
  return matchingRequest('/student/recommendations');
}
