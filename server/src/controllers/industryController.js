const industryService = require('../services/industryService');

async function getIndustryDashboard(req, res, next) {
  try {
    const dashboard = await industryService.getIndustryDashboard(req.session.user.id);
    res.status(200).json({ dashboard });
  } catch (error) {
    next(error);
  }
}

async function getCompanyProfile(req, res, next) {
  try {
    const company = await industryService.getCompanyProfile(req.session.user.id);
    res.status(200).json({ company });
  } catch (error) {
    next(error);
  }
}

async function upsertCompanyProfile(req, res, next) {
  try {
    const company = await industryService.upsertCompanyProfile(req.session.user.id, req.body || {});
    res.status(200).json({ message: 'Company profile saved successfully.', company });
  } catch (error) {
    next(error);
  }
}

async function createJob(req, res, next) {
  try {
    const opportunity = await industryService.createOpportunityForRecruiter(req.session.user.id, 'job', req.body || {});
    res.status(201).json({ message: 'Job created successfully.', opportunity });
  } catch (error) {
    next(error);
  }
}

async function createInternship(req, res, next) {
  try {
    const opportunity = await industryService.createOpportunityForRecruiter(req.session.user.id, 'internship', req.body || {});
    res.status(201).json({ message: 'Internship created successfully.', opportunity });
  } catch (error) {
    next(error);
  }
}

async function createProject(req, res, next) {
  try {
    const opportunity = await industryService.createOpportunityForRecruiter(req.session.user.id, 'project', req.body || {});
    res.status(201).json({ message: 'Project created successfully.', opportunity });
  } catch (error) {
    next(error);
  }
}

async function listOpportunities(req, res, next) {
  try {
    const opportunities = await industryService.listOpportunities(req.session.user.id);
    res.status(200).json({ opportunities });
  } catch (error) {
    next(error);
  }
}

async function updateOpportunity(req, res, next) {
  try {
    const opportunity = await industryService.updateOpportunity(req.session.user.id, req.params.id, req.body || {});
    res.status(200).json({ message: 'Opportunity updated successfully.', opportunity });
  } catch (error) {
    next(error);
  }
}

async function publishOpportunity(req, res, next) {
  try {
    const opportunity = await industryService.publishOpportunity(req.session.user.id, req.params.id);
    res.status(200).json({ message: 'Opportunity published successfully.', opportunity });
  } catch (error) {
    next(error);
  }
}

async function closeOpportunity(req, res, next) {
  try {
    const opportunity = await industryService.closeOpportunity(req.session.user.id, req.params.id);
    res.status(200).json({ message: 'Opportunity closed successfully.', opportunity });
  } catch (error) {
    next(error);
  }
}

async function searchCandidates(req, res, next) {
  try {
    const candidates = await industryService.searchCandidatesForRecruiter(req.session.user.id, req.query || {});
    res.status(200).json({ candidates });
  } catch (error) {
    next(error);
  }
}

async function getCandidateScorecard(req, res, next) {
  try {
    const scorecard = await industryService.getCandidateScorecard(req.session.user.id, req.params.candidateId);
    res.status(200).json({ scorecard });
  } catch (error) {
    next(error);
  }
}

async function createShortlist(req, res, next) {
  try {
    const shortlist = await industryService.shortlistCandidate(req.session.user.id, req.body || {});
    res.status(201).json(shortlist);
  } catch (error) {
    next(error);
  }
}

async function listApplications(req, res, next) {
  try {
    const applications = await industryService.listApplications(req.session.user.id);
    res.status(200).json({ applications });
  } catch (error) {
    next(error);
  }
}

async function addFeedback(req, res, next) {
  try {
    const feedback = await industryService.addFeedbackForApplication(req.session.user.id, req.params.id, req.body || {});
    res.status(200).json(feedback);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getIndustryDashboard,
  getCompanyProfile,
  upsertCompanyProfile,
  createJob,
  createInternship,
  createProject,
  listOpportunities,
  updateOpportunity,
  publishOpportunity,
  closeOpportunity,
  searchCandidates,
  getCandidateScorecard,
  createShortlist,
  listApplications,
  addFeedback,
};
