import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStudentApplications } from '../../services/opportunitiesApi';
import SectionCard from '../../components/common/SectionCard';
import { readCacheSync } from '../../utils/cache';

export default function StudentApplicationsPage() {
  const cachedApps = readCacheSync('applications_student');
  const [applications, setApplications] = useState(cachedApps || []);
  const [loading, setLoading] = useState(!cachedApps);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadApplications = async () => {
      try {
        setLoading(true);
        const setFormatted = (data) => { if(isMounted) setApplications(data); };
        const data = await fetchStudentApplications(setFormatted);
        setFormatted(data);
      } catch (err) {
        if (isMounted) setError('Failed to load applications');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadApplications();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="p-8">Loading applications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
          <p className="text-sm text-slate-500">Track the status of your job and internship applications.</p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">{error}</div>}

      <SectionCard>
        {applications.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">You haven't applied to any opportunities yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">Company</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Applied On</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold rounded-tr-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">{app.company_name}</td>
                    <td className="px-4 py-3">{app.title}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs bg-slate-100 border border-slate-200 rounded">{app.type}</span>
                    </td>
                    <td className="px-4 py-3">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border
                        ${app.status === 'APPLIED' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        ${app.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                        ${app.status === 'SHORTLISTED' ? 'bg-brand-50 text-brand-700 border-brand-200' : ''}
                        ${app.status === 'SELECTED' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${app.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                      `}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/student/opportunities/${app.opportunity_id}`} className="text-brand-600 hover:text-brand-800 font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
