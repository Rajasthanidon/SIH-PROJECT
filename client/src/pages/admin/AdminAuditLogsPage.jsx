import { useState, useEffect } from 'react';
import { fetchAdminAuditLogs } from '../../services/adminApi';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    action: '',
    entityType: ''
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminAuditLogs({ page, limit: 25, ...filters });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1); // Reset to page 1 on filter
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('CREATED')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('UPDATED')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('APPROVED')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (action.includes('REJECTED') || action.includes('DEACTIVATED')) return 'bg-red-50 text-red-700 border-red-200';
    if (action.includes('SUSPENDED')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (action.includes('ACTIVATED')) return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="page-content relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Audit Logs</h2>
          <p className="text-slate-600 mt-2">Append-only historical record of administrative actions.</p>
        </div>
        <div className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Total Records: {total}
        </div>
      </div>

      <div className="panel-card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Entity Type</label>
            <select
              name="entityType"
              value={filters.entityType}
              onChange={handleFilterChange}
              className="input-field py-2 text-sm"
            >
              <option value="">All Entities</option>
              <option value="user">Users</option>
              <option value="opportunity">Opportunities</option>
              <option value="notification_batch">Notifications</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Action</label>
            <input
              type="text"
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              placeholder="e.g. STUDENT_SUSPENDED"
              className="input-field py-2 text-sm w-64"
            />
          </div>
        </div>
      </div>

      <div className="panel-card overflow-hidden">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 mb-4 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actor (Admin)</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entity</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">Loading audit records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500 bg-slate-50">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-semibold text-slate-900">{log.actor_name}</div>
                      <div className="text-xs text-slate-500">{log.actor_email}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">{log.entity_type}</span>
                      <br/>
                      <span className="text-xs text-slate-500">ID: {log.entity_id}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {log.metadata ? (
                        <pre className="bg-slate-100 p-2 rounded text-[10px] overflow-hidden whitespace-pre-wrap">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-slate-400 italic">No details</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
            <span className="text-sm text-slate-500">
              Showing page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
