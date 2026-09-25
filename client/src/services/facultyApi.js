const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function facultyRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/faculty${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Faculty request failed.');
  }

  return payload;
}

export async function fetchFacultyDashboard() {
  return facultyRequest('/dashboard');
}

export async function fetchFacultyStudents() {
  return facultyRequest('/students');
}

export async function fetchFacultyStudentProfile(userId) {
  return facultyRequest(`/students/${userId}/profile`);
}

export async function fetchFacultyAnalytics() {
  return facultyRequest('/analytics');
}

export async function fetchFacultyMentorship() {
  return facultyRequest('/mentorship');
}

export async function fetchFacultyTraining() {
  return facultyRequest('/training');
}

export async function fetchFacultyWorkshops() {
  return facultyRequest('/workshops');
}

export async function fetchFacultyCollaboration() {
  return facultyRequest('/collaboration');
}

export async function fetchFacultySkillTrends() {
  return facultyRequest('/skill-trends');
}
