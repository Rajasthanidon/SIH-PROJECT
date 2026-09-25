const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function placementRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/placement${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Placement request failed.');
  }

  return payload;
}

export async function fetchPlacementDashboard() {
  return placementRequest('/dashboard');
}

export async function fetchPlacementStudents() {
  return placementRequest('/students');
}

export async function importPlacementStudents(csv) {
  return placementRequest('/students/import', {
    method: 'POST',
    body: JSON.stringify({ csv }),
  });
}

export async function fetchPlacementRecruiters() {
  return placementRequest('/recruiters');
}

export async function fetchPlacementDrives() {
  return placementRequest('/drives');
}

export async function fetchPlacementOpportunities() {
  return placementRequest('/opportunities');
}

export async function fetchPlacementApplications() {
  return placementRequest('/applications');
}

export async function fetchPlacementShortlists() {
  return placementRequest('/shortlists');
}

export async function fetchPlacementTracking() {
  return placementRequest('/tracking');
}

export async function fetchPlacementAnalytics() {
  return placementRequest('/analytics');
}

export async function fetchPlacementReports() {
  return placementRequest('/reports');
}
