import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { searchIndustryCandidates, shortlistCandidate } from '../../services/industryApi';

function IndustryCandidatesPage() {
  const [filters, setFilters] = useState({ role: 'Frontend Developer', skill: 'React', minScore: '60' });
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCandidates = async (nextFilters = filters) => {
    try {
      setLoading(true);
      const response = await searchIndustryCandidates(nextFilters);
      setCandidates(response.candidates || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load candidates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    const nextFilters = { ...filters, [name]: value };
    setFilters(nextFilters);
    loadCandidates(nextFilters);
  };

  const handleShortlist = async (candidate) => {
    try {
      await shortlistCandidate({
        candidateId: candidate.userId,
        opportunityId: 'demo-opportunity',
        reason: 'Strong fit based on the role requirement match.',
      });
      setError('');
    } catch (shortlistError) {
      setError(shortlistError.message || 'Unable to shortlist this candidate.');
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading candidate matches…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Candidate search" subtitle="Find and filter role-fit candidates by technical readiness">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm text-slate-700">
            <span>Target role</span>
            <input name="role" value={filters.role} onChange={handleFilterChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            <span>Skill</span>
            <input name="skill" value={filters.skill} onChange={handleFilterChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            <span>Min score</span>
            <input type="number" min="0" max="100" name="minScore" value={filters.minScore} onChange={handleFilterChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Candidate results" subtitle="Role-aligned scorecards and fit summary">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="space-y-4">
          {candidates.length ? candidates.map((candidate) => (
            <div key={candidate.userId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{candidate.name}</p>
                  <p className="text-sm text-slate-600">{candidate.targetRole || 'Role not specified'} • {candidate.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-700">{candidate.scorecard.score}% match</span>
                  <button type="button" onClick={() => handleShortlist(candidate)} className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800">Shortlist</button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Matched skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {candidate.scorecard.matchedSkills?.map((item) => (
                      <span key={`${candidate.userId}-${item.name}`} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{item.name}: {item.current}%</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Top strengths</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {candidate.scorecard.strengths?.map((item) => (
                      <span key={`${candidate.userId}-strength-${item}`} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{item}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )) : <p className="text-sm text-slate-500">No candidates match the current filters.</p>}
        </div>
      </SectionCard>
    </div>
  );
}

export default IndustryCandidatesPage;
