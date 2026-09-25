const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function industryRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/industry${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Industry request failed.');
  }

  return payload;
}

export async function fetchIndustryDashboard() {
  return industryRequest('/dashboard');
}

export async function fetchCompanyProfile() {
  return industryRequest('/company');
}

export async function saveCompanyProfile(company) {
  return industryRequest('/company', {
    method: 'PUT',
    body: JSON.stringify(company),
  });
}

export async function fetchIndustryOpportunities() {
  return industryRequest('/opportunities');
}

export async function createIndustryOpportunity(type, payload) {
  return industryRequest(`/${type === 'job' ? 'jobs' : type === 'internship' ? 'internships' : 'projects'}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function publishOpportunity(opportunityId) {
  return industryRequest(`/opportunities/${opportunityId}/publish`, {
    method: 'PATCH',
  });
}

export async function closeOpportunity(opportunityId) {
  return industryRequest(`/opportunities/${opportunityId}/close`, {
    method: 'PATCH',
  });
}

export async function searchIndustryCandidates(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const query = params.toString();
  return industryRequest(`/candidates${query ? `?${query}` : ''}`);
}

export async function fetchCandidateScorecard(candidateId) {
  return industryRequest(`/candidates/${candidateId}`);
}

export async function shortlistCandidate(payload) {
  return industryRequest('/shortlists', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchIndustryApplications() {
  return industryRequest('/applications');
}

export async function submitApplicationFeedback(applicationId, payload) {
  return industryRequest(`/applications/${applicationId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
