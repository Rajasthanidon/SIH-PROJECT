const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function adminRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || 'Admin request failed.');
  }

  return payload;
}

export async function fetchAdminStats() {
  return adminRequest('/stats');
}

export async function fetchAdminStudents() {
  return adminRequest('/students');
}

export async function fetchAdminFaculty() {
  return adminRequest('/faculty');
}

export async function fetchAdminIndustry() {
  return adminRequest('/industry');
}

export async function fetchAdminPlacementCell() {
  return adminRequest('/placement-cell');
}

export async function fetchAdminJobs() {
  return adminRequest('/jobs');
}

export async function fetchAdminInternships() {
  return adminRequest('/internships');
}

export async function fetchAdminApplications() {
  return adminRequest('/applications');
}

export async function fetchAdminApplicationById(id) {
  return adminRequest(`/applications/${id}`);
}

export async function fetchAdminAnalyticsOverview() {
  return adminRequest('/analytics/overview');
}

export async function createAdminNotification(data) {
  return adminRequest('/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchAdminNotificationHistory() {
  return adminRequest('/notifications');
}

export async function fetchAdminAuditLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.action) query.append('action', params.action);
  if (params.entityType) query.append('entityType', params.entityType);
  
  return adminRequest(`/audit-logs?${query.toString()}`);
}

// ─── MASTER DATA ────────────────────────────────────────────────────────────

export async function fetchMasterDepartments() {
  return adminRequest('/master-data/departments');
}

export async function addMasterDepartment(name) {
  return adminRequest('/master-data/departments', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
}

export async function updateMasterDepartmentStatus(id, isActive) {
  return adminRequest(`/master-data/departments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  });
}

export async function fetchAdminOpportunityById(id) {
  return adminRequest(`/opportunities/${id}`);
}

export async function updateAdminOpportunityStatus(id, status) {
  return adminRequest(`/opportunities/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function fetchAdminStudentById(id) {
  return adminRequest(`/students/${id}`);
}

export async function fetchAdminStudentProfile(id) {
  return adminRequest(`/students/${id}/profile`);
}

export async function createAdminStudent(payload) {
  return adminRequest('/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminStudent(id, payload) {
  return adminRequest(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminStudent(id) {
  return adminRequest(`/students/${id}`, {
    method: 'DELETE',
  });
}

export async function approveAdminStudent(id) {
  return adminRequest(`/students/${id}/approve`, { method: 'PATCH' });
}

export async function rejectAdminStudent(id) {
  return adminRequest(`/students/${id}/reject`, { method: 'PATCH' });
}

export async function suspendAdminStudent(id) {
  return adminRequest(`/students/${id}/suspend`, { method: 'PATCH' });
}

export async function activateAdminStudent(id) {
  return adminRequest(`/students/${id}/activate`, { method: 'PATCH' });
}

export async function resendAdminStudentVerification(id) {
  return adminRequest(`/students/${id}/resend-verification`, { method: 'POST' });
}

export async function fetchApprovalQueue({ search = '', emailVerified, department, page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search) params.set('search', search);
  if (emailVerified !== undefined) params.set('emailVerified', String(emailVerified));
  if (department) params.set('department', department);
  return adminRequest(`/approvals/queue?${params.toString()}`);
}


export async function fetchApprovalStats() {
  return adminRequest('/approvals/stats');
}

// ─── Faculty API (extended) ───────────────────────────────────────────────────

export async function fetchAdminFacultyStats() {
  return adminRequest('/faculty/stats');
}

export async function fetchAdminFacultyById(id) {
  return adminRequest(`/faculty/${id}`);
}

export async function createAdminFaculty(payload) {
  return adminRequest('/faculty', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateAdminFaculty(id, payload) {
  return adminRequest(`/faculty/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function suspendAdminFaculty(id) {
  return adminRequest(`/faculty/${id}/suspend`, { method: 'PATCH' });
}

export async function activateAdminFaculty(id) {
  return adminRequest(`/faculty/${id}/activate`, { method: 'PATCH' });
}

export async function deactivateAdminFaculty(id) {
  return adminRequest(`/faculty/${id}`, { method: 'DELETE' });
}

export async function resendAdminFacultyVerification(id) {
  return adminRequest(`/faculty/${id}/resend-verification`, { method: 'POST' });
}

// ─── Industry API (extended) ──────────────────────────────────────────────────

export async function fetchAdminIndustryStats() {
  return adminRequest('/industry/stats');
}

export async function fetchAdminIndustryById(id) {
  return adminRequest(`/industry/${id}`);
}

export async function createAdminIndustry(payload) {
  return adminRequest('/industry', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateAdminIndustry(id, payload) {
  return adminRequest(`/industry/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function suspendAdminIndustry(id) {
  return adminRequest(`/industry/${id}/suspend`, { method: 'PATCH' });
}

export async function activateAdminIndustry(id) {
  return adminRequest(`/industry/${id}/activate`, { method: 'PATCH' });
}

export async function deactivateAdminIndustry(id) {
  return adminRequest(`/industry/${id}`, { method: 'DELETE' });
}

export async function resendAdminIndustryVerification(id) {
  return adminRequest(`/industry/${id}/resend-verification`, { method: 'POST' });
}

export async function fetchAdminIndustryJobs(id) {
  return adminRequest(`/industry/${id}/jobs`);
}

export async function fetchAdminIndustryInternships(id) {
  return adminRequest(`/industry/${id}/internships`);
}

export async function fetchAdminIndustryApplications(id) {
  return adminRequest(`/industry/${id}/applications`);
}

// --- Placement Cell Admin ---
export async function fetchAdminPlacementCells() {
  return adminRequest('/placement-cell');
}

export async function fetchAdminPlacementStats() {
  return adminRequest('/placement-cell/stats');
}

export async function fetchAdminPlacementById(id) {
  return adminRequest(`/placement-cell/${id}`);
}

export async function createAdminPlacement(payload) {
  return adminRequest('/placement-cell', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateAdminPlacement(id, payload) {
  return adminRequest(`/placement-cell/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function suspendAdminPlacement(id) {
  return adminRequest(`/placement-cell/${id}/suspend`, { method: 'PATCH' });
}

export async function activateAdminPlacement(id) {
  return adminRequest(`/placement-cell/${id}/activate`, { method: 'PATCH' });
}

export async function deactivateAdminPlacement(id) {
  return adminRequest(`/placement-cell/${id}`, { method: 'DELETE' });
}

export async function resendAdminPlacementVerification(id) {
  return adminRequest(`/placement-cell/${id}/resend-verification`, { method: 'POST' });
}
