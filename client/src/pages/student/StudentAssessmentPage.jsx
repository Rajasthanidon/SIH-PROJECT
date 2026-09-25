import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../../components/common/SectionCard';
import { fetchAvailableSkills, fetchSkillTopics, startAssessment, submitAssessment } from '../../services/assessmentApi';

const DEFAULT_DIFFICULTY = 'medium';

function StudentAssessmentPage() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [topicList, setTopicList] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadSkills() {
      try {
        setError('');
        const setFormatted = (response) => {
          if (!isMounted) return;
          const nextSkills = response.skills || [];
          setSkills(nextSkills);
          if (!selectedSkill && nextSkills[0]?.name) {
            setSelectedSkill(nextSkills[0].name);
          }
        };
        const response = await fetchAvailableSkills(search, false, setFormatted);
        setFormatted(response);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load skills.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSkills();
    return () => { isMounted = false; };
  }, [search]);

  useEffect(() => {
    if (!selectedSkill) {
      setTopicList([]);
      setSelectedTopics([]);
      return;
    }

    let isMounted = true;
    async function loadTopics() {
      try {
        setError('');
        const setFormatted = (response) => {
          if (!isMounted) return;
          const nextTopics = response.topics || [];
          setTopicList(nextTopics);
          setSelectedTopics(nextTopics);
        };
        const response = await fetchSkillTopics(selectedSkill, setFormatted);
        setFormatted(response);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load skill topics.');
      }
    }

    loadTopics();
    return () => { isMounted = false; };
  }, [selectedSkill]);

  const activeAssessment = useMemo(() => assessment, [assessment]);
  const activeQuestion = activeAssessment?.questions?.[currentQuestionIndex] || null;
  const progressPercent = activeAssessment ? ((currentQuestionIndex + 1) / activeAssessment.questions.length) * 100 : 0;

  async function handleStartAssessment() {
    if (!selectedSkill) {
      setError('Please choose a skill to assess.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      const payload = {
        skill: selectedSkill,
        difficulty: DEFAULT_DIFFICULTY,
        topics: selectedTopics.length ? selectedTopics : topicList,
        questionCount: Math.max(5, Math.min(25, (selectedTopics.length || topicList.length || 1) * 5)),
      };
      const response = await startAssessment(payload);
      setAssessment(response.assessment);
      setAnswers({});
      setCurrentQuestionIndex(0);
    } catch (startError) {
      setError(startError.message || 'Unable to start assessment.');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleTopic(topic) {
    setSelectedTopics((current) => {
      if (current.includes(topic)) {
        return current.filter((item) => item !== topic);
      }
      return [...current, topic];
    });
  }

  function toggleAllTopics() {
    setSelectedTopics((current) => (current.length === topicList.length ? [] : [...topicList]));
  }

  function handleAnswerChange(questionId, option) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: option,
    }));
  }

  async function handleSubmitAssessment() {
    if (!activeAssessment) {
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      const payload = activeAssessment.questions.map((question) => ({
        questionId: question.id,
        answer: answers[question.id] || '',
      }));

      await submitAssessment(activeAssessment.id, payload);
      navigate(`/student/assessment-result/${activeAssessment.id}`);
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit assessment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !skills.length) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading skills…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Select a skill to assess" subtitle="Choose any skill and pick the topics you want to evaluate.">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Search skill</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search JavaScript, Python, SQL, React..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {skills.map((skill) => (
              <button
                key={skill.name}
                type="button"
                onClick={() => setSelectedSkill(skill.name)}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                  selectedSkill === skill.name
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {skill.name}
              </button>
            ))}
          </div>

          {selectedSkill ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Selected skill</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{selectedSkill}</p>
                </div>
                <button type="button" onClick={toggleAllTopics} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                  {selectedTopics.length === topicList.length ? 'Clear all' : 'Select all'}
                </button>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {topicList.length ? topicList.map((topic) => (
                  <label key={topic} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={() => toggleTopic(topic)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                    <span>{topic}</span>
                  </label>
                )) : <p className="text-sm text-slate-500">No topics available yet for this skill.</p>}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleStartAssessment}
            disabled={submitting || !selectedSkill}
            className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? 'Starting...' : 'Start assessment'}
          </button>
        </div>
      </SectionCard>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      {activeAssessment && activeQuestion ? (
        <SectionCard title={`${activeAssessment.skill} assessment`} subtitle={`${activeAssessment.questions.length} questions • Topic: ${activeQuestion.topic}`}>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Question {currentQuestionIndex + 1} of {activeAssessment.questions.length}</span>
                <span>{activeQuestion.topic}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-4 text-lg font-semibold text-slate-900">{activeQuestion.prompt}</p>
              <div className="space-y-3">
                {(activeQuestion.options || []).map((option) => (
                  <label key={`${activeQuestion.id}-${option}`} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-slate-700">
                    <input
                      type="radio"
                      name={activeQuestion.id}
                      value={option}
                      checked={answers[activeQuestion.id] === option}
                      onChange={() => handleAnswerChange(activeQuestion.id, option)}
                      className="h-4 w-4 border-slate-300 text-brand-600"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((index) => Math.max(index - 1, 0))}
                disabled={currentQuestionIndex === 0}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {currentQuestionIndex < activeAssessment.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((index) => Math.min(index + 1, activeAssessment.questions.length - 1))}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitAssessment}
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting ? 'Submitting...' : 'Submit assessment'}
                </button>
              )}
            </div>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

export default StudentAssessmentPage;
