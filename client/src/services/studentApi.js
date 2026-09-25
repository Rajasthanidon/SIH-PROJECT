import { withCache, removeCache, CACHE_TTL } from '../utils/cache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function studentRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/student${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Student request failed.');
  }

  return payload;
}

export async function fetchStudentDashboard(onBackgroundUpdate = null) {
  return withCache('dashboard', () => studentRequest('/dashboard'), CACHE_TTL.DASHBOARD, false, onBackgroundUpdate);
}

export async function fetchStudentSkillGap(onBackgroundUpdate = null) {
  return withCache('skill-gap', () => studentRequest('/skill-gap'), CACHE_TTL.SKILLS, false, onBackgroundUpdate);
}

export async function fetchStudentRecommendations(onBackgroundUpdate = null) {
  return withCache('recommendations', () => studentRequest('/recommendations'), CACHE_TTL.SKILLS, false, onBackgroundUpdate);
}

export async function fetchStudentProfile(onBackgroundUpdate = null) {
  return withCache('profile', () => studentRequest('/profile'), CACHE_TTL.PROFILE, false, onBackgroundUpdate);
}

export async function updateStudentProfile(profile) {
  const data = await studentRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
  removeCache('profile');
  return data;
}

export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append('profilePhoto', file);
  const response = await fetch(`${API_BASE_URL}/student/profile/photo`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || 'Failed to upload photo.');
  removeCache('profile');
  return payload;
}

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append('resumeFile', file);
  const response = await fetch(`${API_BASE_URL}/student/profile/resume`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(payload?.error?.message || 'Failed to upload resume.');
    err.payload = payload;
    throw err;
  }
  removeCache('profile');
  return payload;
}

export async function fetchStudentSkills(onBackgroundUpdate = null) {
  return withCache('skills', () => studentRequest('/skills'), CACHE_TTL.SKILLS, false, onBackgroundUpdate);
}

export async function updateStudentSkills(skills) {
  const data = await studentRequest('/skills', {
    method: 'PUT',
    body: JSON.stringify({ skills }),
  });
  removeCache('skills');
  removeCache('dashboard');
  return data;
}

export async function fetchStudentTopics(onBackgroundUpdate = null) {
  return withCache('topics', () => studentRequest('/topics'), CACHE_TTL.SKILLS, false, onBackgroundUpdate);
}

export async function updateStudentTopics(topics) {
  const data = await studentRequest('/topics', {
    method: 'PUT',
    body: JSON.stringify({ topics }),
  });
  removeCache('topics');
  return data;
}

export async function fetchStudentEducation(onBackgroundUpdate = null) {
  return withCache('education', () => studentRequest('/education'), CACHE_TTL.EDUCATION, false, onBackgroundUpdate);
}

export async function createStudentEducation(payload) {
  const data = await studentRequest('/education', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  removeCache('education');
  removeCache('dashboard');
  return data;
}

export async function deleteStudentEducation(educationId) {
  const data = await studentRequest(`/education/${educationId}`, {
    method: 'DELETE',
  });
  removeCache('education');
  removeCache('dashboard');
  return data;
}

export async function fetchStudentProjects(onBackgroundUpdate = null) {
  return withCache('projects', () => studentRequest('/projects'), CACHE_TTL.PROJECTS, false, onBackgroundUpdate);
}

export async function createStudentProject(project) {
  const data = await studentRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
  removeCache('projects');
  removeCache('dashboard');
  return data;
}

export async function submitStudentProject(projectId) {
  const data = await studentRequest(`/projects/${projectId}/submit`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  removeCache('projects');
  removeCache('dashboard');
  return data;
}

export async function fetchStudentInternships(onBackgroundUpdate = null) {
  return withCache('internships', () => studentRequest('/internships'), CACHE_TTL.INTERNSHIPS, false, onBackgroundUpdate);
}

export async function createStudentInternship(internship) {
  const data = await studentRequest('/internships', {
    method: 'POST',
    body: JSON.stringify(internship),
  });
  removeCache('internships');
  removeCache('dashboard');
  return data;
}

export async function submitStudentInternship(internshipId) {
  const data = await studentRequest(`/internships/${internshipId}/submit`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  removeCache('internships');
  removeCache('dashboard');
  return data;
}

export async function fetchStudentCertifications(onBackgroundUpdate = null) {
  return withCache('certifications', () => studentRequest('/certifications'), CACHE_TTL.CERTIFICATIONS, false, onBackgroundUpdate);
}

export async function createStudentCertification(certification) {
  const data = await studentRequest('/certifications', {
    method: 'POST',
    body: JSON.stringify(certification),
  });
  removeCache('certifications');
  removeCache('dashboard');
  return data;
}

export async function fetchStudentPortfolio(onBackgroundUpdate = null) {
  return withCache('portfolio', () => studentRequest('/portfolio'), CACHE_TTL.PROFILE, false, onBackgroundUpdate);
}
