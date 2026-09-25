import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import SectionCard from '../../components/common/SectionCard';
import { fetchCandidateOpportunityMatch } from '../../services/matchingApi';

function MatchExplanationPage() {
  const { opportunityId } = useParams();
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('candidateId');
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMatch() {
      if (!candidateId || !opportunityId) {
        setError('A candidate and opportunity are required to render the match explanation.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchCandidateOpportunityMatch(candidateId, opportunityId);
        setMatch(response.match);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load the match explanation.');
      } finally {
        setLoading(false);
      }
    }

    loadMatch();
  }, [candidateId, opportunityId]);

  const sections = useMemo(() => [
    { label: 'Matched', values: match?.skillMatch?.matched || [] },
    { label: 'Partial', values: match?.skillMatch?.partial || [] },
    { label: 'Gap', values: match?.skillMatch?.gap || [] },
  ], [match]);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading match explanation…</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Candidate match explanation" subtitle="Deterministic score breakdown based on structured skill, topic, evidence, and eligibility data">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-600">Result</p>
            <h2 className="mt-2 text-4xl font-bold text-slate-900">{match?.score ?? 0}%</h2>
          </div>
          <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
            Eligibility: <span className="font-semibold uppercase">{match?.eligibilityStatus}</span>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-3">
        {sections.map((section) => (
          <SectionCard key={section.label} title={section.label} subtitle={`${section.values.length} items`}>
            {section.values.length ? (
              <ul className="space-y-2">
                {section.values.map((item) => (
                  <li key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No {section.label.toLowerCase()} items.</p>
            )}
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Why this score was assigned" subtitle="Structured reasoning and evidence">
        <div className="space-y-3">
          {match?.explanation?.map((line, index) => (
            <p key={`${line}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{line}</p>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default MatchExplanationPage;
