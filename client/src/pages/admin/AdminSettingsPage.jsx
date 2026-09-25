import { useState, useEffect } from 'react';
import { 
  fetchMasterDepartments, 
  addMasterDepartment, 
  updateMasterDepartmentStatus 
} from '../../services/adminApi';

export default function AdminSettingsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchMasterDepartments();
      setDepartments(res.departments || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      setSubmitting(true);
      await addMasterDepartment(newDeptName.trim());
      setNewDeptName('');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await updateMasterDepartmentStatus(id, !currentStatus);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-content relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Platform Settings</h2>
          <p className="text-slate-600 mt-2">Manage centralized master data and platform configurations.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Master Data: Departments */}
        <div className="panel-card">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-between">
            <span>Departments</span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {departments.length}
            </span>
          </h3>

          <form onSubmit={handleAddDepartment} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="e.g. Computer Science"
              className="input-field flex-1"
              required
            />
            <button
              type="submit"
              disabled={submitting || !newDeptName.trim()}
              className="btn-primary whitespace-nowrap"
            >
              {submitting ? 'Adding...' : 'Add Department'}
            </button>
          </form>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Name</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-center w-24">Status</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && departments.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-500 text-sm">Loading...</td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-500 text-sm">No departments found.</td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-semibold text-slate-700">
                        {dept.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md border ${
                          dept.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {dept.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(dept.id, dept.is_active)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            dept.is_active 
                              ? 'text-red-600 border-red-200 hover:bg-red-50' 
                              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {dept.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Future Master Data / Settings place holders */}
        <div className="space-y-8">
          <div className="panel-card opacity-70">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Registration Open/Close (Coming Soon)</h3>
            <p className="text-sm text-slate-500 mb-4">Toggle platform registration access for various user roles.</p>
            <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg border border-slate-100">
              Currently managed via environment variable <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">PUBLIC_REGISTRATION_ROLES</code>.
            </div>
          </div>
          
          <div className="panel-card opacity-70">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Academic Year & Batch Settings (Coming Soon)</h3>
            <p className="text-sm text-slate-500 mb-4">Centrally manage the active academic year and valid graduating batches for opportunities.</p>
            <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg border border-slate-100">
              Currently free-text JSON arrays on individual opportunities.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
