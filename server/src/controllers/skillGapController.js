const studentRepository = require('../repositories/student.repository');
const skillGapService = require('../services/skillGapService');

async function getSkillGapAnalysis(req, res, next) {
  try {
    const profile = await studentRepository.getStudentProfile(req.session.user.id);
    const analysis = await skillGapService.getSkillGapAnalysisForUser(req.session.user.id, profile);

    res.status(200).json({
      message: 'Skill gap analysis generated successfully.',
      analysis,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSkillGapAnalysis,
};
