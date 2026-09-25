import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../../components/common/SectionCard';
import { fetchStudentDashboard } from '../../services/studentApi';
import { readCacheSync } from '../../utils/cache';

function StudentTopicsPage() {
  const navigate = useNavigate();
  const cachedDash = readCacheSync('dashboard');
  const [topics, setTopics] = useState(cachedDash ? (cachedDash.dashboard?.topicPerformance || cachedDash.topicPerformance || []) : []);
  const [loading, setLoading] = useState(!cachedDash);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadTopics() {
      try {
        setLoading(true);
        const setFormatted = (response) => {
          if (!isMounted) return;
          const dashboard = response.dashboard || response;
          setTopics(dashboard.topicPerformance || []);
        };
        const response = await fetchStudentDashboard(setFormatted);
        setFormatted(response);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load topic results.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTopics();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading topic scores…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Assessment topics" subtitle="Topic scores come from actual assessment answers and cannot be edited manually.">
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        {topics.length ? (
          <div className="space-y-4">
            {topics.map((topic, index) => (
              <div key={`${topic.name}-${index}`} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium text-slate-800">{topic.name}</p>
                  <span className="text-sm font-semibold text-brand-700">{topic.score || 0}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${topic.score || 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">No topic scores are available yet. Complete a skill assessment to generate them.</p>
            <button type="button" onClick={() => navigate('/student/assessments')} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Take skill assessment</button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default StudentTopicsPage;
