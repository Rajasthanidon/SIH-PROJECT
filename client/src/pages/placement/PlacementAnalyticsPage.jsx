import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchPlacementAnalytics } from '../../services/placementApi';

function PlacementAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetchPlacementAnalytics();
        setAnalytics(response.analytics);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="panel-card text-center text-slate-500">Loading placement analytics…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Skill readiness analytics" subtitle="Department-level student and opportunity readiness">
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
              <p className="text-sm text-slate-500">Applications</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{analytics.summary?.applications || 0}</p>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}

export default PlacementAnalyticsPage;
