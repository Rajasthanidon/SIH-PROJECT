const placementRepository = require('../repositories/placement.repository');

async function getPlacementDashboard(userId) {
  return placementRepository.getPlacementDashboard(userId);
}

async function getPlacementStudents(userId) {
  return placementRepository.getPlacementStudentRecords(userId);
}

async function importStudentsFromCsv(userId, payload = {}) {
  return placementRepository.importStudentsFromCsv(payload.csv || payload.data || '');
}

async function getRecruiters(userId) {
  return placementRepository.getRecruiters(userId);
}

async function getDrives(userId) {
  return placementRepository.getDrives(userId);
}

async function getOpportunities(userId) {
  return placementRepository.getOpportunities(userId);
}

async function getApplications(userId) {
  return placementRepository.getApplications(userId);
}

async function getShortlists(userId) {
  return placementRepository.getShortlists(userId);
}

async function getPlacementTracking(userId) {
  return placementRepository.getPlacementTracking(userId);
}

async function getPlacementAnalytics(userId) {
  return placementRepository.getPlacementAnalytics(userId);
}

async function getReports(userId) {
  return placementRepository.getReports(userId);
}

module.exports = {
  getPlacementDashboard,
  getPlacementStudents,
  importStudentsFromCsv,
  getRecruiters,
  getDrives,
  getOpportunities,
  getApplications,
  getShortlists,
  getPlacementTracking,
  getPlacementAnalytics,
  getReports,
};
