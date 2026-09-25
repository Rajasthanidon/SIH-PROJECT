import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchPlacementStudents } from '../../services/placementApi';

function PlacementStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStudents() {
      try {
        const response = await fetchPlacementStudents();
        setStudents(response.students || []);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load student records.');
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  if (loading) {
    return <div className="panel-card text-center text-slate-500">Loading student records…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Student records" subtitle="Placement pipeline and readiness tracking">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-3">
          {students.length ? students.map((student) => (
            <div key={student.userId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{student.name}</p>
                  <p className="text-sm text-slate-600">{student.targetRole}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-700">{student.readiness}% readiness</span>
              </div>
            </div>
          )) : <p className="text-sm text-slate-500">No student records are available yet.</p>}
        </div>
      </SectionCard>
    </div>
  );
}

export default PlacementStudentsPage;
