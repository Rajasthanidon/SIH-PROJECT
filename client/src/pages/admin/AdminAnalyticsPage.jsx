import { useState, useEffect } from 'react';
import { fetchAdminAnalyticsOverview } from '../../services/adminApi';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchAdminAnalyticsOverview();
        setData(res);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const downloadCSV = () => {
    if (!data) return;
    
    // Prepare a basic flat CSV string of the overview stats
    let csv = 'Metric,Value\n';
    csv += `Total Students,${data.overview.totalStudents}\n`;
    csv += `Pending Students,${data.overview.pendingStudents}\n`;
    csv += `Total Faculty,${data.overview.totalFaculty}\n`;
    csv += `Total Industry,${data.overview.totalIndustry}\n`;
    csv += `Total Jobs,${data.overview.totalJobs}\n`;
    csv += `Total Internships,${data.overview.totalInternships}\n`;
    csv += `Total Applications,${data.overview.totalApplications}\n`;
    
    csv += `\nApplication Status,Count\n`;
    data.applications.statusDistribution.forEach(app => {
      csv += `${app.status},${app.count}\n`;
    });

    csv += `\nStudent Department,Count\n`;
    data.students.departmentDistribution.forEach(dept => {
      csv += `"${dept.department}",${dept.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'analytics_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return <div className="page-content flex items-center justify-center min-h-[60vh] text-slate-500">Loading analytics...</div>;
  }

  if (error) {
    return (
      <div className="page-content relative">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const totalApps = data.overview.totalApplications || 1; // avoid division by zero
  const totalStudents = data.overview.totalStudents || 1;

  return (
    <div className="page-content relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Analytics & Reporting</h2>
          <p className="text-slate-600 mt-2">Platform-wide statistics and data insights.</p>
        </div>
        <button 
          onClick={downloadCSV}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-indigo-500">
          <p className="text-sm font-semibold text-slate-500 uppercase">Total Students</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{data.overview.totalStudents}</p>
        </div>
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-emerald-500">
          <p className="text-sm font-semibold text-slate-500 uppercase">Opportunities</p>
          <p className="text-4xl font-bold text-emerald-600 mt-2">{data.overview.totalJobs + data.overview.totalInternships}</p>
        </div>
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-brand-500">
          <p className="text-sm font-semibold text-slate-500 uppercase">Applications</p>
          <p className="text-4xl font-bold text-brand-600 mt-2">{data.overview.totalApplications}</p>
        </div>
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-amber-500">
          <p className="text-sm font-semibold text-slate-500 uppercase">Companies</p>
          <p className="text-4xl font-bold text-amber-600 mt-2">{data.overview.totalIndustry}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Application Status Distribution (Native CSS) */}
        <div className="panel-card flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Application Status Distribution</h3>
          <div className="flex-1 space-y-4">
            {data.applications.statusDistribution.map(s => {
              const percent = Math.round((s.count / totalApps) * 100);
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700">{s.status}</span>
                    <span className="text-slate-500">{s.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
            {data.applications.statusDistribution.length === 0 && (
              <p className="text-slate-500 text-sm">No applications found.</p>
            )}
          </div>
        </div>

        {/* Department Distribution Chart (Native CSS) */}
        <div className="panel-card flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Students by Department</h3>
          <div className="flex-1 space-y-4">
            {data.students.departmentDistribution.map(d => {
              const percent = Math.round((d.count / totalStudents) * 100);
              return (
                <div key={d.department}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700">{d.department}</span>
                    <span className="text-slate-500">{d.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
            {data.students.departmentDistribution.length === 0 && (
              <p className="text-slate-500 text-sm">No departments found.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="panel-card">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Opportunity Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Total Jobs</span>
              <span className="font-bold text-slate-900">{data.overview.totalJobs}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Total Internships</span>
              <span className="font-bold text-slate-900">{data.overview.totalInternships}</span>
            </div>
            {data.opportunities.distribution.map(opp => (
              <div key={opp.type + opp.status} className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500">{opp.type} ({opp.status})</span>
                <span className="font-semibold text-slate-700">{opp.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <h3 className="text-lg font-bold text-slate-900 mb-4">User Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Total Faculty</span>
              <span className="font-bold text-slate-900">{data.overview.totalFaculty}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Placement Cell Members</span>
              <span className="font-bold text-slate-900">{data.overview.totalPlacementCell}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500">Students Pending Approval</span>
              <span className="font-semibold text-amber-600">{data.overview.pendingStudents}</span>
            </div>
            {data.students.statusDistribution.map(s => (
              <div key={s.status + s.is_active} className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500">Students ({s.status} / {s.is_active ? 'Active' : 'Inactive'})</span>
                <span className="font-semibold text-slate-700">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
