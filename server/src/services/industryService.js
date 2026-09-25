const AppError = require('../utils/AppError');
const industryRepository = require('../repositories/industry.repository');
const { findUserById } = require('../repositories/user.repository');
const studentRepository = require('../repositories/student.repository');

function validateOwnership(userId, companyOrOpportunity, contextLabel = 'resource') {
  if (!companyOrOpportunity) {
    throw new AppError(`${contextLabel} not found.`, 404);
  }

  if (Number(userId) !== Number(companyOrOpportunity.recruiterId)) {
    throw new AppError(`You are not authorized to access this ${contextLabel}.`, 403);
  }
}

async function resolveMutationTarget(userId, resourceId, contextLabel = 'opportunity') {
  const opportunity = await industryRepository.getOpportunityById(resourceId);
  if (opportunity) {
    validateOwnership(userId, opportunity, contextLabel);
    return opportunity;
  }

  const company = await industryRepository.getCompanyById(resourceId);
  if (company) {
    if (Number(userId) !== Number(company.recruiterId)) {
      throw new AppError(`You are not authorized to access this ${contextLabel}.`, 403);
    }

    throw new AppError(`${contextLabel} not found.`, 404);
  }

  throw new AppError(`${contextLabel} not found.`, 404);
}

function normalizeCompanyPayload(payload = {}) {
  return {
    companyName: String(payload.companyName || payload.company_name || '').trim(),
    industry: String(payload.industry || '').trim(),
    website: String(payload.website || '').trim(),
    location: String(payload.location || '').trim(),
    description: String(payload.description || '').trim(),
  };
}

function normalizeOpportunityPayload(type, payload = {}) {
  const title = String(payload.title || '').trim();
  const description = String(payload.description || '').trim();
  const location = String(payload.location || '').trim();
  const eligibility = String(payload.eligibility || '').trim();

  if (!title || !description) {
    throw new AppError('Opportunity title and description are required.', 400);
  }

  return {
    type: String(type || payload.type || 'job').trim().toLowerCase(),
    title,
    description,
    location,
    requiredSkills: Array.isArray(payload.requiredSkills) ? payload.requiredSkills.map(String) : [],
    requiredTopics: Array.isArray(payload.requiredTopics) ? payload.requiredTopics.map(String) : [],
    minimumProficiency: Number(payload.minimumProficiency ?? payload.minimum_proficiency ?? 0),
    eligibility,
    preferredSkills: Array.isArray(payload.preferredSkills) ? payload.preferredSkills.map(String) : [],
    status: String(payload.status || 'draft').trim().toLowerCase(),
  };
}

function getCandidateProfile(userId) {
  return studentRepository.getStudentProfile(userId);
}

async function getIndustryDashboard(userId) {
  const company = await industryRepository.getCompanyByRecruiterId(userId);
  const opportunities = await industryRepository.listOpportunitiesForRecruiter(userId);
  const applications = await industryRepository.listApplicationsForRecruiter(userId);
  const shortlists = await industryRepository.listShortlistsForRecruiter(userId);

  return {
    company,
    opportunityCount: opportunities.length,
    publishedCount: opportunities.filter((item) => item.status === 'published').length,
    activeApplications: applications.filter((item) => ['reviewing', 'shortlisted', 'selected'].includes(item.status)).length,
    shortlistCount: shortlists.length,
    opportunities: opportunities.slice(0, 6),
    applications: applications.slice(0, 5),
  };
}

async function upsertCompanyProfile(userId, payload = {}) {
  const safePayload = normalizeCompanyPayload(payload);

  if (!safePayload.companyName) {
    throw new AppError('Company name is required.', 400);
  }

  const company = await industryRepository.getCompanyByRecruiterId(userId);
  const persisted = await industryRepository.upsertCompany(userId, {
    ...(company || {}),
    ...safePayload,
    recruiterId: userId,
  });

  return persisted;
}

async function getCompanyProfile(userId) {
  const company = await industryRepository.getCompanyByRecruiterId(userId);
  return company;
}

async function createOpportunityForRecruiter(userId, type, payload = {}) {
  const company = await industryRepository.getCompanyByRecruiterId(userId);
  if (!company) {
    throw new AppError('Create a company profile before publishing opportunities.', 400);
  }

  const safePayload = normalizeOpportunityPayload(type, payload);
  const opportunity = await industryRepository.createOpportunity({
    recruiterId: userId,
    companyId: company.id,
    ...safePayload,
  });

  return opportunity;
}

async function updateOpportunity(userId, opportunityId, payload = {}) {
  const opportunity = await resolveMutationTarget(userId, opportunityId, 'opportunity');

  const updates = normalizeOpportunityPayload(opportunity.type || payload.type || 'job', payload);
  return industryRepository.updateOpportunityById(opportunityId, {
    ...opportunity,
    ...updates,
    status: updates.status || opportunity.status,
  });
}

async function publishOpportunity(userId, opportunityId) {
  const opportunity = await resolveMutationTarget(userId, opportunityId, 'opportunity');

  return industryRepository.updateOpportunityById(opportunityId, {
    ...opportunity,
    status: 'published',
  });
}

async function closeOpportunity(userId, opportunityId) {
  const opportunity = await resolveMutationTarget(userId, opportunityId, 'opportunity');

  return industryRepository.updateOpportunityById(opportunityId, {
    ...opportunity,
    status: 'closed',
  });
}

async function listOpportunities(userId) {
  return industryRepository.listOpportunitiesForRecruiter(userId);
}

async function searchCandidatesForRecruiter(userId, filters = {}) {
  const candidates = await industryRepository.searchCandidates(filters);
  return candidates.map((candidate) => ({
    ...candidate,
    recruiterId: userId,
  }));
}

async function getCandidateScorecard(userId, candidateId) {
  const profile = await getCandidateProfile(candidateId);
  if (!profile) {
    throw new AppError('Candidate not found.', 404);
  }

  const user = await findUserById(candidateId);
  const scorecard = {
    userId: Number(candidateId),
    name: user?.name || 'Candidate',
    email: user?.email || '',
    targetRole: profile.targetRole || 'Not specified',
    score: Math.max(0, Math.min(100, Math.round((profile.skills || []).reduce((sum, skill) => sum + Number(skill.level || 0), 0) / Math.max((profile.skills || []).length, 1)))),
    matchedSkills: (profile.skills || []).slice(0, 4).map((skill) => ({
      name: skill.name,
      current: Number(skill.level || 0),
    })),
    topicScores: (profile.topics || []).slice(0, 4).map((topic) => ({
      name: topic.name,
      current: Number(topic.score || 0),
    })),
    strengths: (profile.skills || []).filter((skill) => Number(skill.level || 0) >= 70).map((skill) => skill.name),
    gaps: (profile.skills || []).filter((skill) => Number(skill.level || 0) < 70).map((skill) => skill.name),
    explainable: true,
  };

  return scorecard;
}

async function shortlistCandidate(userId, payload = {}) {
  const opportunity = await industryRepository.getOpportunityById(payload.opportunityId);
  if (!opportunity) {
    throw new AppError('Opportunity not found.', 404);
  }

  validateOwnership(userId, opportunity, 'opportunity');

  const shortlist = await industryRepository.createShortlist({
    recruiterId: userId,
    companyId: opportunity.companyId,
    opportunityId: opportunity.id,
    candidateId: Number(payload.candidateId),
    reason: String(payload.reason || '').trim(),
  });

  await industryRepository.createApplication({
    recruiterId: userId,
    companyId: opportunity.companyId,
    opportunityId: opportunity.id,
    candidateId: Number(payload.candidateId),
    status: 'shortlisted',
    feedback: 'Candidate shortlisted for next review.',
  });

  return {
    shortlist: await industryRepository.listShortlistsForRecruiter(userId),
  };
}

async function listApplications(userId) {
  return industryRepository.listApplicationsForRecruiter(userId);
}

async function addFeedbackForApplication(userId, applicationId, payload = {}) {
  const application = await industryRepository.getApplicationById(applicationId);
  if (!application) {
    throw new AppError('Application not found.', 404);
  }

  if (Number(userId) !== Number(application.recruiterId)) {
    throw new AppError('You are not authorized to provide feedback on this application.', 403);
  }

  const updated = await industryRepository.updateApplicationFeedback(applicationId, {
    status: payload.status || application.status,
    feedback: payload.feedback || application.feedback,
  });

  return { feedback: updated };
}

module.exports = {
  getIndustryDashboard,
  upsertCompanyProfile,
  getCompanyProfile,
  createOpportunityForRecruiter,
  updateOpportunity,
  publishOpportunity,
  closeOpportunity,
  listOpportunities,
  searchCandidatesForRecruiter,
  getCandidateScorecard,
  shortlistCandidate,
  listApplications,
  addFeedbackForApplication,
};
