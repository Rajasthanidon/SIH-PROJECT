const facultyRepository = require('../repositories/faculty.repository');

async function getFacultyDashboard(userId) {
  return facultyRepository.getFacultyDashboard(userId);
}

async function getFacultyStudents(userId) {
  return facultyRepository.getStudentSummaries(userId);
}

async function getFacultyStudentProfile(userId, targetUserId) {
  if (!targetUserId) {
    throw new Error('Student identifier is required.');
  }

  return facultyRepository.getFacultyStudentProfile(targetUserId);
}

async function getFacultyAnalytics(userId) {
  return facultyRepository.getFacultyAnalytics(userId);
}

async function getMentorshipData(userId) {
  return facultyRepository.getMentorshipData(userId);
}

async function getTrainingRecommendations(userId) {
  return facultyRepository.getTrainingRecommendations(userId);
}

async function getWorkshops(userId) {
  return facultyRepository.getWorkshops(userId);
}

async function getIndustryCollaboration(userId) {
  return facultyRepository.getIndustryCollaboration(userId);
}

async function getIndustrySkillTrends(userId) {
  return facultyRepository.getIndustrySkillTrends(userId);
}

module.exports = {
  getFacultyDashboard,
  getFacultyStudents,
  getFacultyStudentProfile,
  getFacultyAnalytics,
  getMentorshipData,
  getTrainingRecommendations,
  getWorkshops,
  getIndustryCollaboration,
  getIndustrySkillTrends,
};
