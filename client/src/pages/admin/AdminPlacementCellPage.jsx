import { useState, useEffect } from 'react';
import {
  fetchAdminPlacementCells,
  fetchAdminPlacementStats,
  fetchAdminPlacementById,
  createAdminPlacement,
  updateAdminPlacement,
  suspendAdminPlacement,
  activateAdminPlacement,
  deactivateAdminPlacement,
  resendAdminPlacementVerification,
} from '../../services/adminApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    ACTIVE:               'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING_APPROVAL:     'bg-blue-50 text-blue-700 border-blue-200',
    PENDING_VERIFICATION: 'bg-amber-50 text-amber-700 border-amber-200',
    SUSPENDED:            'bg-red-50 text-red-700 border-red-200',
  };
  const labels = {
    ACTIVE: 'Active',
    PENDING_APPROVAL: 'Needs Approval',
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

// ─── Placement Detail Modal ───────────────────────────────────────────────────

function PlacementDetailModal({ placementId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminPlacementById(placementId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [placementId]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-900">Placement Cell Member Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        {loading ? (
          <div className="px-6 py-12 text-center text-slate-400">Loading…</div>
        ) : !data ? (
          <div className="px-6 py-12 text-center text-red-600">Failed to load details.</div>
        ) : (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xl font-bold">
                {data.name?.charAt(0)?.toUpperCase() || 'P'}
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
                ['Designation', data.designation || '—'],
                ['Joined', fmt(data.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-slate-400">{label}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
              <strong>Note:</strong> Placement Cell accounts have high platform privileges. Ensure you only activate verified and authorized personnel.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', email: '', username: '', password: '', designation: '' };

function PlacementFormModal({ editingId, initialData, onClose, onSaved }) {
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
      if (editingId) await updateAdminPlacement(editingId, form);
      else await createAdminPlacement(form);
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
          <h3 className="text-lg font-bold">{editingId ? 'Edit Placement Cell Member' : 'Add New Member'}</h3>
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
          <input type="text" className="input-field" placeholder="Designation (e.g. Placement Officer) *" {...field('designation')} />
          
          {!editingId && (
            <p className="text-xs text-slate-400">Account will start in PENDING_APPROVAL state.</p>
          )}
        </div>
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button className="ghost-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="primary-button" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : (editingId ? 'Save Changes' : 'Create Member')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPlacementCellPage() {
  const [placementCells, setPlacementCells] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [detailId, setDetailId] = useState(null);
  const [editModal, setEditModal] = useState(null); // null | { id, data } | 'new'
  const [toast, setToast] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminPlacementCells(),
        fetchAdminPlacementStats(),
      ]);
      setPlacementCells(listRes.users || listRes || []);
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
      const ok = window.confirm(`${action === 'deactivate' ? 'Deactivate' : 'Suspend'} account for "${name}"?`);
      if (!ok) return;
    }
    try {
      if (action === 'suspend')              await suspendAdminPlacement(id);
      else if (action === 'activate')        await activateAdminPlacement(id);
      else if (action === 'deactivate')      await deactivateAdminPlacement(id);
      else if (action === 'resend')          await resendAdminPlacementVerification(id);
      showToast(`${name}: action "${action}" completed.`);
      load();
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  }

  const filtered = Array.isArray(placementCells) ? placementCells.filter(p => {
    const term = search.toLowerCase();
    const matchSearch = !term ||
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.username && p.username.toLowerCase().includes(term)) ||
      (p.designation && p.designation.toLowerCase().includes(term));
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  }) : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl font-medium text-sm">
            {toast.text}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Placement Cell</h1>
          <p className="text-slate-500 mt-1">Manage platform administrators and placement officers.</p>
        </div>
        <button className="primary-button whitespace-nowrap" onClick={() => setEditModal('new')}>
          + Add Member
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['Total Members', stats.total, 'bg-slate-100 text-slate-600'],
            ['Active', stats.active, 'bg-emerald-50 text-emerald-600'],
            ['Pending Approval', stats.pendingApproval, 'bg-blue-50 text-blue-600'],
            ['Suspended', stats.suspended, 'bg-red-50 text-red-600']
          ].map(([label, val, colors]) => (
            <div key={label} className={`p-4 rounded-xl border border-slate-200/50 ${colors} shadow-sm`}>
              <p className="text-sm font-semibold opacity-80">{label}</p>
              <p className="text-3xl font-black mt-1">{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, designation..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Main Table Content */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">Loading placement cell data...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <p>{error}</p>
            <button onClick={load} className="mt-4 text-sm font-semibold text-brand-600 hover:underline">Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <p>No placement cell members found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Member</th>
                  <th className="px-6 py-4 font-semibold">Designation</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Email Auth</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                          {p.name?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-500">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{p.designation || '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4"><EmailBadge verified={p.email_verified} /></td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setDetailId(p.id)} className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded transition-colors">
                        View
                      </button>
                      <button onClick={() => setEditModal({ id: p.id, data: p })} className="text-xs font-semibold text-brand-600 hover:text-brand-900 px-2 py-1 bg-brand-50 hover:bg-brand-100 rounded transition-colors">
                        Edit
                      </button>
                      
                      {p.status === 'PENDING_APPROVAL' && (
                        <button onClick={() => handleAction(p.id, 'activate', p.name)} className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors">
                          Approve
                        </button>
                      )}

                      {p.status === 'ACTIVE' && (
                        <button onClick={() => handleAction(p.id, 'suspend', p.name)} className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors">
                          Suspend
                        </button>
                      )}

                      {p.status === 'SUSPENDED' && (
                        <button onClick={() => handleAction(p.id, 'activate', p.name)} className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors">
                          Activate
                        </button>
                      )}

                      {!p.email_verified && (
                        <button onClick={() => handleAction(p.id, 'resend', p.name)} className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors" title="Resend Verification">
                          ✉️
                        </button>
                      )}

                      <button onClick={() => handleAction(p.id, 'deactivate', p.name)} className="text-xs font-semibold text-red-600 hover:text-red-900 px-2 py-1 hover:bg-red-50 rounded transition-colors" title="Deactivate completely">
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailId && <PlacementDetailModal placementId={detailId} onClose={() => setDetailId(null)} />}
      
      {editModal && (
        <PlacementFormModal 
          editingId={editModal === 'new' ? null : editModal.id}
          initialData={editModal === 'new' ? null : {
            name: editModal.data.name,
            email: editModal.data.email,
            username: editModal.data.username,
            designation: editModal.data.designation,
          }}
          onClose={() => setEditModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
