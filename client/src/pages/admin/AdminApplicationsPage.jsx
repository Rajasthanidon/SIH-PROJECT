import { useState, useEffect } from 'react';
import { fetchAdminApplications } from '../../services/adminApi';
import AdminApplicationModal from '../../components/admin/AdminApplicationModal';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL'); // JOB or INTERNSHIP
  
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  
  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminApplications();
      setApplications(res.applications || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApplications = applications.filter(a => {
    // Status Filter
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    
    // Type Filter
    if (typeFilter !== 'ALL' && a.opportunity_type !== typeFilter) return false;
    
    // Search Filter (by student name, opportunity title, or company)
    const term = search.toLowerCase();
    if (term) {
      const matchesSearch = 
        (a.student_name && a.student_name.toLowerCase().includes(term)) ||
        (a.opportunity_title && a.opportunity_title.toLowerCase().includes(term)) ||
        (a.company_name && a.company_name.toLowerCase().includes(term));
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  return (
    <div className="page-content relative">
      
      {selectedApplicationId && (
        <AdminApplicationModal 
          applicationId={selectedApplicationId} 
          onClose={() => setSelectedApplicationId(null)}
        />
      )}

      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Applications</h2>
          <p className="text-slate-600 mt-2">View all applications submitted by students across all opportunities.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-slate-400">
          <p className="text-sm font-semibold text-slate-500 uppercase">Total Applications</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{applications.length}</p>
        </div>
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-brand-500">
          <p className="text-sm font-semibold text-slate-500 uppercase">Shortlisted</p>
          <p className="text-4xl font-bold text-brand-600 mt-2">
            {applications.filter(a => a.status === 'SHORTLISTED').length}
          </p>
        </div>
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-emerald-500">
          <p className="text-sm font-semibold text-slate-500 uppercase">Selected</p>
          <p className="text-4xl font-bold text-emerald-600 mt-2">
            {applications.filter(a => a.status === 'SELECTED').length}
          </p>
        </div>
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-amber-500">
          <p className="text-sm font-semibold text-slate-500 uppercase">Under Review</p>
          <p className="text-4xl font-bold text-amber-600 mt-2">
            {applications.filter(a => a.status === 'UNDER_REVIEW').length}
          </p>
        </div>
      </div>

      <div className="panel-card mb-6 flex flex-wrap justify-between items-center gap-4">
        <input 
          type="text"
          className="input-field max-w-sm"
          placeholder="Search student, opportunity, or company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-4">
          <select 
            className="input-field max-w-xs"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="JOB">Jobs</option>
            <option value="INTERNSHIP">Internships</option>
          </select>

          <select 
            className="input-field max-w-xs"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="SELECTED">Selected</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="panel-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Applicant</th>
                <th className="px-6 py-4">Opportunity</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Applied On</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center">Loading applications...</td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center">No applications found matching your criteria.</td>
                </tr>
              ) : (
                filteredApplications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{app.student_name}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{app.opportunity_title}</td>
                    <td className="px-6 py-4 text-slate-500">{app.company_name}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        {app.opportunity_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        app.status === 'SELECTED' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.status === 'REJECTED' || app.status === 'WITHDRAWN'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : app.status === 'SHORTLISTED'
                          ? 'bg-brand-50 text-brand-700 border border-brand-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedApplicationId(app.id)}
                        className="text-brand-600 hover:text-brand-800 font-medium text-sm"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
