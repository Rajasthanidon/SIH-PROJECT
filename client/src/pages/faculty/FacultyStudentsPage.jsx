import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchFacultyStudents } from '../../services/facultyApi';

function FacultyStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStudents() {
      try {
        const response = await fetchFacultyStudents();
        setStudents(response.students || []);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load student list.');
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading student list…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Student list" subtitle="Faculty-facing view of academic readiness and role alignment">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-4">
          {students.length ? students.map((student) => (
            <div key={student.userId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{student.name}</p>
                  <p className="text-sm text-slate-600">Target role: {student.targetRole}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-700">{student.readiness}% readiness</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(student.skills || []).map((skill) => (
                  <span key={`${student.userId}-${skill.name}`} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200">{skill.name}: {skill.level}%</span>
                ))}
              </div>
            </div>
          )) : <p className="text-sm text-slate-500">No students have been synced yet.</p>}
        </div>
      </SectionCard>
    </div>
  );
}

export default FacultyStudentsPage;
