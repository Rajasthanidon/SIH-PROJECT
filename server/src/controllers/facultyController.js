const facultyService = require('../services/facultyService');

async function getFacultyDashboard(req, res, next) {
  try {
    const dashboard = await facultyService.getFacultyDashboard(req.session.user.id);
    res.status(200).json({ dashboard });
  } catch (error) {
    next(error);
  }
}

async function getFacultyStudents(req, res, next) {
  try {
    const students = await facultyService.getFacultyStudents(req.session.user.id);
    res.status(200).json({ students });
  } catch (error) {
    next(error);
  }
}

async function getFacultyStudentProfile(req, res, next) {
  try {
    const student = await facultyService.getFacultyStudentProfile(req.session.user.id, req.params.userId);
    res.status(200).json({ student });
  } catch (error) {
    next(error);
  }
}

async function getFacultyAnalytics(req, res, next) {
  try {
    const analytics = await facultyService.getFacultyAnalytics(req.session.user.id);
    res.status(200).json({ analytics });
  } catch (error) {
    next(error);
  }
}

async function getFacultyMentorship(req, res, next) {
  try {
    const mentorship = await facultyService.getMentorshipData(req.session.user.id);
    res.status(200).json({ mentorship });
  } catch (error) {
    next(error);
  }
}

async function getFacultyTrainingRecommendations(req, res, next) {
  try {
    const recommendations = await facultyService.getTrainingRecommendations(req.session.user.id);
    res.status(200).json({ recommendations });
  } catch (error) {
    next(error);
  }
}

async function getFacultyWorkshops(req, res, next) {
  try {
    const workshops = await facultyService.getWorkshops(req.session.user.id);
    res.status(200).json({ workshops });
  } catch (error) {
    next(error);
  }
}

async function getFacultyIndustryCollaboration(req, res, next) {
  try {
    const collaboration = await facultyService.getIndustryCollaboration(req.session.user.id);
    res.status(200).json({ collaboration });
  } catch (error) {
    next(error);
  }
}

async function getFacultyIndustrySkillTrends(req, res, next) {
  try {
    const trends = await facultyService.getIndustrySkillTrends(req.session.user.id);
    res.status(200).json({ trends });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFacultyDashboard,
  getFacultyStudents,
  getFacultyStudentProfile,
  getFacultyAnalytics,
  getFacultyMentorship,
  getFacultyTrainingRecommendations,
  getFacultyWorkshops,
  getFacultyIndustryCollaboration,
  getFacultyIndustrySkillTrends,
};
