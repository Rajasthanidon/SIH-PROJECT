import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchFacultyDashboard } from '../../services/facultyApi';

function FacultyDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetchFacultyDashboard();
        setDashboard(response.dashboard);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load faculty dashboard.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading faculty dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-600">Faculty</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Dashboard</h1>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {dashboard ? (
        <div className="grid gap-6 md:grid-cols-4">
          <SectionCard title="Students" subtitle="Monitored learner count"><p className="text-3xl font-bold text-slate-900">{dashboard.totalStudents}</p></SectionCard>
          <SectionCard title="Readiness" subtitle="Average progress"><p className="text-3xl font-bold text-slate-900">{dashboard.averageReadiness}%</p></SectionCard>
          <SectionCard title="Mentorship" subtitle="Active relationships"><p className="text-3xl font-bold text-slate-900">{dashboard.mentorshipCount}</p></SectionCard>
          <SectionCard title="Workshops" subtitle="Planned sessions"><p className="text-3xl font-bold text-slate-900">{dashboard.workshopCount}</p></SectionCard>
        </div>
      ) : null}

      {dashboard?.topWeakSkills?.length ? (
        <SectionCard title="Priority training needs" subtitle="Weakest aggregate skill areas">
          <div className="space-y-3">
            {dashboard.topWeakSkills.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>{item.name}</span>
                <span className="font-semibold text-orange-600">{item.gapScore} gap</span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

export default FacultyDashboardPage;
