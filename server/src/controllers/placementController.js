const placementService = require('../services/placementService');

async function getPlacementDashboard(req, res, next) {
  try {
    const dashboard = await placementService.getPlacementDashboard(req.session.user.id);
    res.status(200).json({ dashboard });
  } catch (error) {
    next(error);
  }
}

async function getPlacementStudents(req, res, next) {
  try {
    const students = await placementService.getPlacementStudents(req.session.user.id);
    res.status(200).json({ students });
  } catch (error) {
    next(error);
  }
}

async function importPlacementStudents(req, res, next) {
  try {
    const imported = await placementService.importStudentsFromCsv(req.session.user.id, req.body || {});
    res.status(200).json({ imported });
  } catch (error) {
    next(error);
  }
}

async function getPlacementRecruiters(req, res, next) {
  try {
    const recruiters = await placementService.getRecruiters(req.session.user.id);
    res.status(200).json({ recruiters });
  } catch (error) {
    next(error);
  }
}

async function getPlacementDrives(req, res, next) {
  try {
    const drives = await placementService.getDrives(req.session.user.id);
    res.status(200).json({ drives });
  } catch (error) {
    next(error);
  }
}

async function getPlacementOpportunities(req, res, next) {
  try {
    const opportunities = await placementService.getOpportunities(req.session.user.id);
    res.status(200).json({ opportunities });
  } catch (error) {
    next(error);
  }
}

async function getPlacementApplications(req, res, next) {
  try {
    const applications = await placementService.getApplications(req.session.user.id);
    res.status(200).json({ applications });
  } catch (error) {
    next(error);
  }
}

async function getPlacementShortlists(req, res, next) {
  try {
    const shortlists = await placementService.getShortlists(req.session.user.id);
    res.status(200).json({ shortlists });
  } catch (error) {
    next(error);
  }
}

async function getPlacementTracking(req, res, next) {
  try {
    const placements = await placementService.getPlacementTracking(req.session.user.id);
    res.status(200).json({ placements });
  } catch (error) {
    next(error);
  }
}

async function getPlacementAnalytics(req, res, next) {
  try {
    const analytics = await placementService.getPlacementAnalytics(req.session.user.id);
    res.status(200).json({ analytics });
  } catch (error) {
    next(error);
  }
}

async function getPlacementReports(req, res, next) {
  try {
    const reports = await placementService.getReports(req.session.user.id);
    res.status(200).json({ reports });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPlacementDashboard,
  getPlacementStudents,
  importPlacementStudents,
  getPlacementRecruiters,
  getPlacementDrives,
  getPlacementOpportunities,
  getPlacementApplications,
  getPlacementShortlists,
  getPlacementTracking,
  getPlacementAnalytics,
  getPlacementReports,
};
