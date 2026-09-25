import { useState, useEffect } from 'react';
import {
  fetchAdminFaculty,
  fetchAdminFacultyStats,
  fetchAdminFacultyById,
  createAdminFaculty,
  updateAdminFaculty,
  suspendAdminFaculty,
  activateAdminFaculty,
  deactivateAdminFaculty,
  resendAdminFacultyVerification,
} from '../../services/adminApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    ACTIVE:               'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING_VERIFICATION: 'bg-amber-50 text-amber-700 border-amber-200',
    SUSPENDED:            'bg-red-50 text-red-700 border-red-200',
  };
  const labels = {
    ACTIVE: 'Active',
    PENDING_VERIFICATION: 'Unverified',
    SUSPENDED: 'Suspended',
  };
  const cls = map[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {labels[status] || status}
    </span>
  );
}

function EmailBadge({ verified }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Verified</span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">⏳ Unverified</span>
  );
}

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Faculty Detail Modal ─────────────────────────────────────────────────────

function FacultyDetailModal({ facultyId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminFacultyById(facultyId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [facultyId]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-900">Faculty Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        {loading ? (
          <div className="px-6 py-12 text-center text-slate-400">Loading…</div>
        ) : !data ? (
          <div className="px-6 py-12 text-center text-red-600">Failed to load faculty details.</div>
        ) : (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xl font-bold">
                {data.name?.charAt(0)?.toUpperCase() || 'F'}
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{data.name}</p>
                <p className="text-sm text-slate-500">{data.email}</p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <StatusBadge status={data.status} />
              <EmailBadge verified={data.email_verified} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ['Username', data.username],
                ['Department', data.department || '—'],
                ['Designation', data.designation || '—'],
                ['Joined', fmt(data.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-slate-400">{label}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
              <strong>Note:</strong> Faculty lifecycle does not require admin approval. Faculty become active after email verification. Admin may suspend or activate accounts directly.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', email: '', username: '', password: '', department: '', designation: '' };

function FacultyFormModal({ editingId, initialData, onClose, onSaved }) {
  const [form, setForm] = useState(initialData || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const field = (key) => ({
    value: form[key] || '',
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  async function handleSubmit() {
    setSaving(true);
    setErr(null);
    try {
      if (editingId) await updateAdminFaculty(editingId, form);
      else await createAdminFaculty(form);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold">{editingId ? 'Edit Faculty' : 'Add New Faculty'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
          <input type="text" className="input-field" placeholder="Full Name *" {...field('name')} />
          <input type="email" className="input-field" placeholder="Email *" {...field('email')} />
          <input type="text" className="input-field" placeholder="Username *" {...field('username')} />
          {!editingId && (
            <input type="password" className="input-field" placeholder="Password (min 8 chars) *" {...field('password')} />
          )}
          <div className="grid grid-cols-2 gap-4">
            <input type="text" className="input-field" placeholder="Department *" {...field('department')} />
            <input type="text" className="input-field" placeholder="Designation *" {...field('designation')} />
          </div>
          {!editingId && (
            <p className="text-xs text-slate-400">Faculty account will start in PENDING_VERIFICATION state. Email verification is required to activate access.</p>
          )}
        </div>
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button className="ghost-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="primary-button" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : (editingId ? 'Save Changes' : 'Create Faculty')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminFacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [detailId, setDetailId] = useState(null);
  const [editModal, setEditModal] = useState(null); // null | { id, data } | 'new'
  const [toast, setToast] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminFaculty(),
        fetchAdminFacultyStats(),
      ]);
      setFaculty(listRes.faculty || listRes.users || []);
      setStats(statsRes);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function showToast(text, type = 'success') {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleAction(id, action, name) {
    const destructive = ['suspend', 'deactivate'].includes(action);
    if (destructive) {
      const ok = window.confirm(`${action === 'deactivate' ? 'Deactivate' : 'Suspend'} faculty "${name}"?`);
      if (!ok) return;
    }
    try {
      if (action === 'suspend')              await suspendAdminFaculty(id);
      else if (action === 'activate')        await activateAdminFaculty(id);
      else if (action === 'deactivate')      await deactivateAdminFaculty(id);
      else if (action === 'resend')          await resendAdminFacultyVerification(id);
      showToast(`${name}: action "${action}" completed.`);
      load();
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  }

  // Client-side filter (small datasets)
  const filtered = faculty.filter(f => {
    const term = search.toLowerCase();
    const matchSearch = !term ||
      (f.name && f.name.toLowerCase().includes(term)) ||
      (f.email && f.email.toLowerCase().includes(term)) ||
      (f.username && f.username.toLowerCase().includes(term)) ||
      (f.department && f.department.toLowerCase().includes(term)) ||
      (f.designation && f.designation.toLowerCase().includes(term));
    const matchStatus = !statusFilter || f.status === statusFilter;
    const matchDept   = !deptFilter   || f.department === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const departments = [...new Set(faculty.map(f => f.department).filter(Boolean))];

  return (
    <div className="page-content">
      {/* Modals */}
      {detailId && (
        <FacultyDetailModal facultyId={detailId} onClose={() => setDetailId(null)} />
      )}
      {editModal && (
        <FacultyFormModal
          editingId={editModal === 'new' ? null : editModal.id}
          initialData={editModal === 'new' ? null : editModal.data}
          onClose={() => setEditModal(null)}
          onSaved={load}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold border ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Faculty Management</h2>
          <p className="text-slate-500 mt-1">
            Manage all faculty accounts. Faculty accounts become active after email verification — no separate admin approval step.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setEditModal('new')}
        >
          Add Faculty
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Faculty',     value: stats?.total ?? '…',      color: 'slate' },
          { label: 'Active',            value: stats?.active ?? '…',     color: 'emerald' },
          { label: 'Email Unverified',  value: stats?.unverified ?? '…', color: 'amber' },
          { label: 'Suspended',         value: stats?.suspended ?? '…',  color: 'red' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`panel-card flex flex-col items-start border-l-4 border-l-${color}-400`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className={`text-4xl font-bold text-${color}-600 mt-2`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="panel-card mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          className="input-field flex-1 min-w-[220px]"
          placeholder="Search name, email, username, department, designation…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input-field w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_VERIFICATION">Unverified</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select className="input-field w-44" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button onClick={load} className="ghost-button shrink-0">Refresh</button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="panel-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-600">
            {loading ? 'Loading…' : `${filtered.length} faculty member${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Faculty</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-400">Loading faculty…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-14 text-center">
                    <p className="text-slate-400 font-semibold">No faculty found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : filtered.map(f => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{f.name}</div>
                    <div className="text-xs text-slate-400">{f.email}</div>
                  </td>
                  <td className="px-6 py-4">{f.department || '—'}</td>
                  <td className="px-6 py-4">{f.designation || '—'}</td>
                  <td className="px-6 py-4"><EmailBadge verified={f.email_verified} /></td>
                  <td className="px-6 py-4"><StatusBadge status={f.status} /></td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{fmt(f.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end flex-wrap gap-1.5">
                      {/* View */}
                      <button
                        onClick={() => setDetailId(f.id)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                      >
                        View
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => setEditModal({ id: f.id, data: { name: f.name, email: f.email, username: f.username, department: f.department || '', designation: f.designation || '', password: '' } })}
                        className="text-xs px-2.5 py-1 rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 font-medium"
                      >
                        Edit
                      </button>

                      {/* Suspend — only for ACTIVE or PENDING_VERIFICATION */}
                      {(f.status === 'ACTIVE' || f.status === 'PENDING_VERIFICATION') && (
                        <button
                          onClick={() => handleAction(f.id, 'suspend', f.name)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 font-medium"
                        >
                          Suspend
                        </button>
                      )}

                      {/* Activate — only for SUSPENDED */}
                      {f.status === 'SUSPENDED' && (
                        <button
                          onClick={() => handleAction(f.id, 'activate', f.name)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium"
                        >
                          Activate
                        </button>
                      )}

                      {/* Resend verification — only for unverified */}
                      {!f.email_verified && (
                        <button
                          onClick={() => handleAction(f.id, 'resend', f.name)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 font-medium"
                        >
                          Resend
                        </button>
                      )}

                      {/* Deactivate (soft-delete) */}
                      <button
                        onClick={() => handleAction(f.id, 'deactivate', f.name)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium"
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
