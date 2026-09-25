import { useState, useEffect } from 'react';
import { fetchAdminInternships } from '../../services/adminApi';
import AdminOpportunityModal from '../../components/admin/AdminOpportunityModal';

export default function AdminInternshipsPage() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  
  const activeCount = internships.filter(j => j.status === 'ACTIVE' || j.status === 'PUBLISHED').length;
  const draftCount = internships.filter(j => j.status === 'DRAFT').length;
  const closedCount = internships.filter(j => j.status === 'CLOSED' || j.status === 'EXPIRED').length;

  const loadInternships = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminInternships();
      setInternships(res.internships || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInternships();
  }, []);

  const filteredInternships = internships.filter(j => {
    const term = search.toLowerCase();
    return (
      (j.title && j.title.toLowerCase().includes(term)) ||
      (j.company_name && j.company_name.toLowerCase().includes(term)) ||
      (j.location && j.location.toLowerCase().includes(term))
    );
  });

  return (
    <div className="page-content relative">
      
      {selectedOpportunityId && (
        <AdminOpportunityModal 
          opportunityId={selectedOpportunityId} 
          onClose={() => setSelectedOpportunityId(null)}
          onUpdated={loadInternships}
        />
      )}

      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Internship Management</h2>
          <p className="text-slate-600 mt-2">Manage and monitor all internship opportunities.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase">Total</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{internships.length}</p>
        </div>
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-emerald-500">
          <p className="text-sm font-semibold text-slate-500 uppercase">Active / Published</p>
          <p className="text-4xl font-bold text-emerald-600 mt-2">{activeCount}</p>
        </div>
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-slate-400">
          <p className="text-sm font-semibold text-slate-500 uppercase">Drafts</p>
          <p className="text-4xl font-bold text-slate-600 mt-2">{draftCount}</p>
        </div>
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-amber-500">
          <p className="text-sm font-semibold text-slate-500 uppercase">Closed / Expired</p>
          <p className="text-4xl font-bold text-amber-600 mt-2">{closedCount}</p>
        </div>
      </div>

      <div className="panel-card mb-6 flex justify-between items-center gap-4">
        <input 
          type="text"
          className="input-field max-w-md"
          placeholder="Search by title, company, location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">Loading internships...</td>
                </tr>
              ) : filteredInternships.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">No internships found.</td>
                </tr>
              ) : (
                filteredInternships.map(intern => (
                  <tr key={intern.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{intern.title}</div>
                      <div className="text-xs text-brand-600">{intern.stipend || 'Unpaid'}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{intern.company_name}</td>
                    <td className="px-6 py-4">{intern.internship_duration || '—'}</td>
                    <td className="px-6 py-4">
                      {intern.application_deadline ? new Date(intern.application_deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        intern.status === 'PUBLISHED' || intern.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : intern.status === 'DRAFT' 
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {intern.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedOpportunityId(intern.id)}
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
