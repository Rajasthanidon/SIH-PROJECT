import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchFacultyAnalytics } from '../../services/facultyApi';

function FacultyAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetchFacultyAnalytics();
        setAnalytics(response.analytics);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading analytics…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Skill-gap analytics" subtitle="Department-level readiness and weak-skill trends">
        {analytics ? (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Students</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{analytics.summary?.students || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Average readiness</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{analytics.summary?.averageReadiness || 0}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Active opportunities</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{analytics.summary?.activeOpportunities || 0}</p>
            </div>
          </div>
        ) : null}

        {analytics?.weakTopicSummary?.length ? (
          <div className="mt-6 space-y-3">
            {analytics.weakTopicSummary.map((item) => (
              <div key={item.skill} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <span>{item.skill}</span>
                <span className="font-semibold text-orange-600">Demand {item.demand}% • gap {item.averageGap}%</span>
              </div>
            ))}
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}

export default FacultyAnalyticsPage;
