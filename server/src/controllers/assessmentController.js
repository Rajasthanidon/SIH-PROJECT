const assessmentService = require('../services/assessmentService');

async function generateAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.generateAssessment(req.session.user.id, req.body || {});
    res.status(201).json({
      message: 'Assessment generated successfully.',
      assessment,
    });
  } catch (error) {
    next(error);
  }
}

async function listTargetRoles(req, res, next) {
  try {
    const roles = await assessmentService.listTargetRoles();
    res.status(200).json({ roles });
  } catch (error) {
    next(error);
  }
}

async function listSkills(req, res, next) {
  try {
    const skills = await assessmentService.searchSkills(req.query.q || req.query.term || '');
    res.status(200).json({ skills });
  } catch (error) {
    next(error);
  }
}

async function getSkillTopics(req, res, next) {
  try {
    const payload = await assessmentService.getSkillTopics(req.params.skillName);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
}

async function getTargetRoleDetails(req, res, next) {
  try {
    const role = await assessmentService.getTargetRoleDefinition(req.params.roleName);
    res.status(200).json(role);
  } catch (error) {
    next(error);
  }
}

async function startAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.startAssessment(req.session.user.id, req.body || {});
    res.status(201).json({
      message: 'Assessment started successfully.',
      assessment,
    });
  } catch (error) {
    next(error);
  }
}

async function submitAssessment(req, res, next) {
  try {
    const result = await assessmentService.submitAssessment(req.session.user.id, req.params.assessmentId, req.body || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getAssessmentResult(req, res, next) {
  try {
    const result = await assessmentService.getAssessmentResult(req.session.user.id, req.params.assessmentId);
    res.status(200).json({ result });
  } catch (error) {
    next(error);
  }
}

async function getAssessmentHistory(req, res, next) {
  try {
    const history = await assessmentService.getAssessmentHistory(req.session.user.id);
    res.status(200).json({ history });
  } catch (error) {
    next(error);
  }
}

async function getLeaderboard(req, res, next) {
  try {
    const leaderboard = await assessmentService.getLeaderboard();
    res.status(200).json(leaderboard);
  } catch (error) {
    next(error);
  }
}

async function getCurrentRank(req, res, next) {
  try {
    const rank = await assessmentService.getCurrentUserRank(req.session.user.id);
    res.status(200).json({ rank });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateAssessment,
  listTargetRoles,
  listSkills,
  getSkillTopics,
  getTargetRoleDetails,
  startAssessment,
  submitAssessment,
  getAssessmentResult,
  getAssessmentHistory,
  getLeaderboard,
  getCurrentRank,
};
