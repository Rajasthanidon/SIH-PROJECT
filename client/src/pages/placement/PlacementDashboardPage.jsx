import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchPlacementDashboard, fetchPlacementAnalytics } from '../../services/placementApi';

function PlacementDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [dashboardResponse, analyticsResponse] = await Promise.all([
          fetchPlacementDashboard(),
          fetchPlacementAnalytics(),
        ]);
        setDashboard(dashboardResponse.dashboard);
        setAnalytics(analyticsResponse.analytics);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load placement dashboard.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="panel-card text-center text-slate-500">Loading placement dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow-text">Placement cell</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-6 md:grid-cols-4">
        <SectionCard title="Students" subtitle="Tracked records">
          <p className="text-3xl font-bold text-slate-900">{dashboard?.students || 0}</p>
        </SectionCard>
        <SectionCard title="Active drives" subtitle="Live pipeline">
          <p className="text-3xl font-bold text-slate-900">{dashboard?.activeDrives || 0}</p>
        </SectionCard>
        <SectionCard title="Recruiters" subtitle="Partner network">
          <p className="text-3xl font-bold text-slate-900">{dashboard?.recruiters || 0}</p>
        </SectionCard>
        <SectionCard title="Applications" subtitle="In process">
          <p className="text-3xl font-bold text-slate-900">{dashboard?.applications || 0}</p>
        </SectionCard>
      </div>

      <SectionCard title="Readiness overview" subtitle="Average skill readiness by tracked students">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Average readiness</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{analytics?.summary?.averageReadiness || 0}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Placement progress</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{analytics?.summary?.placements || 0}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default PlacementDashboardPage;
