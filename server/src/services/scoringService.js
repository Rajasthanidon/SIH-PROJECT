function normalizeScore(score) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function computeConfidence(answerText) {
  if (!answerText || String(answerText).trim().length === 0) {
    return 0;
  }

  const lengthScore = Math.min(40, String(answerText).length / 2);
  const structureBonus = /\b(because|example|for example|therefore|however|while)\b/i.test(answerText) ? 20 : 0;
  const clarityBonus = /\b(understand|concept|approach|trade-off|implementation|pattern|scenario)\b/i.test(answerText) ? 20 : 0;

  return normalizeScore(lengthScore + structureBonus + clarityBonus);
}

function evaluateSingleAnswer(question, answerText) {
  const text = String(answerText || '').trim();

  if (!text) {
    return {
      score: 0,
      confidence: 0,
      feedback: 'No answer was provided.',
    };
  }

  const keywords = [String(question.skill || ''), String(question.topic || ''), 'example', 'trade-off', 'implementation', 'concept']
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const uniqueKeywords = [...new Set(keywords)];
  const matches = uniqueKeywords.filter((keyword) => text.toLowerCase().includes(keyword)).length;
  const coverage = (matches / Math.max(uniqueKeywords.length, 1)) * 60;
  const lengthValue = Math.min(25, text.length / 12);
  const structureValue = /\b(example|for example|because|therefore|however)\b/i.test(text) ? 15 : 0;
  const finalScore = normalizeScore(coverage + lengthValue + structureValue);

  return {
    score: finalScore,
    confidence: computeConfidence(text),
    feedback: finalScore >= 75 ? 'Strong understanding with practical clarity.' : finalScore >= 50 ? 'Moderate understanding; add more concrete examples.' : 'Needs deeper conceptual explanation and examples.',
  };
}

function evaluateAssessment({ assessment, answers = [] }) {
  const answerMap = new Map((answers || []).map((entry) => [String(entry.questionId), String(entry.answer || '')]));
  const topicScores = new Map();

  assessment.questions.forEach((question) => {
    const answerText = answerMap.get(question.id) || '';
    const outcome = evaluateSingleAnswer(question, answerText);
    const current = topicScores.get(question.topic) || [];
    current.push({
      questionId: question.id,
      score: outcome.score,
      confidence: outcome.confidence,
      feedback: outcome.feedback,
    });
    topicScores.set(question.topic, current);
  });

  const topicSummary = Array.from(topicScores.entries()).map(([topic, entries]) => {
    const average = entries.reduce((sum, item) => sum + item.score, 0) / Math.max(entries.length, 1);
    return {
      topic,
      score: normalizeScore(average),
      mastery: average >= 80 ? 'Strong' : average >= 60 ? 'Moderate' : 'Developing',
      questions: entries.length,
    };
  });

  const skillScore = normalizeScore(topicSummary.reduce((sum, result) => sum + result.score, 0) / Math.max(topicSummary.length, 1));
  const strengths = topicSummary.filter((result) => result.score >= 70).map((result) => result.topic);
  const weaknesses = topicSummary.filter((result) => result.score < 60).map((result) => result.topic);
  const skillGaps = topicSummary.filter((result) => result.score < 70).map((result) => ({
    topic: result.topic,
    gap: 100 - result.score,
    recommendation: 'Build stronger conceptual understanding and review practical examples.',
  }));

  return {
    assessmentId: assessment.id,
    skillScore,
    topicScores: topicSummary,
    strengths: strengths.length ? strengths : ['Continue building practical examples to strengthen readiness.'],
    weaknesses: weaknesses.length ? weaknesses : ['No major weaknesses detected at this stage.'],
    skillGaps,
    normalized: true,
    scoreVersion: 'v1',
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  normalizeScore,
  evaluateSingleAnswer,
  evaluateAssessment,
};
