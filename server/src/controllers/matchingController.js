const matchingService = require('../services/matchingService');

async function getCandidateOpportunityMatch(req, res, next) {
  try {
    const result = await matchingService.getOpportunityMatch(req.params.candidateId, req.params.opportunityId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getOpportunityCandidateRanking(req, res, next) {
  try {
    const matches = await matchingService.rankCandidatesForOpportunity(req.params.opportunityId, req.query || {});
    res.status(200).json({
      opportunityId: req.params.opportunityId,
      count: matches.length,
      matches,
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentRecommendations(req, res, next) {
  try {
    const recommendations = await matchingService.getStudentRecommendations(req.session.user.id);
    res.status(200).json({
      message: 'Recommendations generated successfully.',
      recommendations,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCandidateOpportunityMatch,
  getOpportunityCandidateRanking,
  getStudentRecommendations,
};
