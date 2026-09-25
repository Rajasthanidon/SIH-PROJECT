import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SectionCard from '../../components/common/SectionCard';
import { fetchAssessmentResult } from '../../services/assessmentApi';
import { readCacheSync } from '../../utils/cache';

function StudentAssessmentResultPage() {
  const { assessmentId } = useParams();
  
  const cachedRes = readCacheSync(`assessment_result_${assessmentId}`);
  // readCacheSync returns the raw API response which has .result, so cachedRes.result
  const initialResult = cachedRes ? (cachedRes.result || cachedRes) : null;

  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(!cachedRes);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadResult() {
      try {
        setLoading(true);
        const setFormatted = (data) => {
          if (isMounted) setResult(data.result || data);
        };
        const data = await fetchAssessmentResult(assessmentId, setFormatted);
        setFormatted(data);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load assessment result.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadResult();
    return () => { isMounted = false; };
  }, [assessmentId]);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading assessment result…</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  if (!result) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No result available yet.</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Assessment result" subtitle="Technical readiness summary">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Technical score</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{result.technicalTestScore ?? result.percentage ?? 0}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Correct answers</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{result.correct ?? 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Attempted</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{result.attempted ?? 0}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Skill-wise breakdown" subtitle="Normalized by assessment result">
        <div className="space-y-4">
          {(result.skillScores || []).map((skill) => (
            <div key={skill.name}>
              <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                <span>{skill.name}</span>
                <span>{skill.score}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${skill.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Strengths">
          <ul className="list-disc space-y-2 pl-5 text-slate-700">
            {(result.strengths || []).map((strength) => <li key={strength}>{strength}</li>)}
          </ul>
        </SectionCard>

        <SectionCard title="Weaknesses">
          <ul className="list-disc space-y-2 pl-5 text-slate-700">
            {(result.weaknesses || []).map((weakness) => <li key={weakness}>{weakness}</li>)}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

export default StudentAssessmentResultPage;
