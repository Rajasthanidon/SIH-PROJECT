import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchOpportunityDetails, fetchOpportunityApplications, updateOpportunityStatus, updateApplicationStatus } from '../../services/opportunitiesApi';
import SectionCard from '../../components/common/SectionCard';

export default function IndustryOpportunityDetailsPage() {
  const { id } = useParams();
  const [opp, setOpp] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [oppData, appsData] = await Promise.all([
        fetchOpportunityDetails(id),
        fetchOpportunityApplications(id)
      ]);
      setOpp(oppData);
      setApplications(appsData);
    } catch (err) {
      setError('Failed to load opportunity data');
    } finally {
      setLoading(false);
    }
  };

  const handleOppStatusChange = async (newStatus) => {
    try {
      await updateOpportunityStatus(id, newStatus);
      setOpp(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleAppStatusChange = async (appId, newStatus) => {
    try {
      await updateApplicationStatus(id, appId, newStatus);
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    } catch (err) {
      alert('Failed to update application status');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!opp) return <div className="p-8 text-red-600">Opportunity not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{opp.title}</h1>
          <p className="text-sm text-slate-500">Manage applications for this opportunity.</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium text-slate-700">Status:</span>
          <select 
            value={opp.status} 
            onChange={(e) => handleOppStatusChange(e.target.value)}
            className="text-sm border-slate-200 rounded"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">{error}</div>}

      <div className="grid md:grid-cols-4 gap-4">
        <SectionCard className="md:col-span-1 text-center">
          <p className="text-3xl font-bold text-slate-900">{applications.length}</p>
          <p className="text-sm text-slate-500 uppercase tracking-widest mt-1">Total Applicants</p>
        </SectionCard>
        
        <SectionCard className="md:col-span-1 text-center">
          <p className="text-3xl font-bold text-slate-900">{applications.filter(a => a.status === 'APPLIED').length}</p>
          <p className="text-sm text-slate-500 uppercase tracking-widest mt-1">New</p>
        </SectionCard>

        <SectionCard className="md:col-span-1 text-center">
          <p className="text-3xl font-bold text-brand-700">{applications.filter(a => a.status === 'SHORTLISTED').length}</p>
          <p className="text-sm text-brand-700 uppercase tracking-widest mt-1">Shortlisted</p>
        </SectionCard>

        <SectionCard className="md:col-span-1 text-center">
          <p className="text-3xl font-bold text-green-700">{applications.filter(a => a.status === 'SELECTED').length}</p>
          <p className="text-sm text-green-700 uppercase tracking-widest mt-1">Selected</p>
        </SectionCard>
      </div>

      <SectionCard title="Applicants">
        {applications.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">No applications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">Student</th>
                  <th className="px-4 py-3 font-semibold">Branch</th>
                  <th className="px-4 py-3 font-semibold">CGPA</th>
                  <th className="px-4 py-3 font-semibold">Applied</th>
                  <th className="px-4 py-3 font-semibold">Resume</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {applications.map(app => {
                  const profile = app.profile_snapshot || {};
                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {app.student_name}
                        <br />
                        <span className="text-xs text-slate-500 font-normal">{app.student_email}</span>
                      </td>
                      <td className="px-4 py-3">{profile.academic_info?.branch || 'N/A'}</td>
                      <td className="px-4 py-3">{profile.academic_info?.cgpa || 'N/A'}</td>
                      <td className="px-4 py-3">{new Date(app.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {profile.resume?.file_path ? (
                          <a href={profile.resume.file_path} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                            View PDF
                          </a>
                        ) : (
                          <span className="text-slate-400">Missing</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={app.status} 
                          onChange={(e) => handleAppStatusChange(app.id, e.target.value)}
                          className={`text-xs font-semibold rounded-full border px-2 py-1
                            ${app.status === 'APPLIED' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            ${app.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                            ${app.status === 'SHORTLISTED' ? 'bg-brand-50 text-brand-700 border-brand-200' : ''}
                            ${app.status === 'SELECTED' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${app.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                          `}
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="SELECTED">Selected</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
