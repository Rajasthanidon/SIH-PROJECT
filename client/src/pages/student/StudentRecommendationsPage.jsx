import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchStudentRecommendations } from '../../services/studentApi';
import { readCacheSync } from '../../utils/cache';

function StudentRecommendationsPage() {
  const cachedRecs = readCacheSync('recommendations');
  const [recommendations, setRecommendations] = useState(cachedRecs ? cachedRecs.recommendations || [] : []);
  const [loading, setLoading] = useState(!cachedRecs);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadRecommendations() {
      try {
        setLoading(true);
        const setFormatted = (res) => { if (isMounted && res) setRecommendations(res.recommendations || []); };
        const response = await fetchStudentRecommendations(setFormatted);
        setFormatted(response);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load recommendations.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRecommendations();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading recommendations…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Recommended improvements" subtitle="Deterministic skill pacing based on your current profile and role target">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {recommendations.length ? (
          <div className="space-y-4">
            {recommendations.map((item) => (
              <div key={`${item.focus}-${item.priority}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">Current: {item.current}% • Target: {item.target}%</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase text-brand-700">Priority {item.priority}</span>
                </div>
                <p className="mt-3 text-sm text-slate-700">{item.reason}</p>
                <p className="mt-2 text-sm text-slate-600">Action: {item.action}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No recommendation gaps were identified yet.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default StudentRecommendationsPage;
