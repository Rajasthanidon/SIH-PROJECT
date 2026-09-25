import { useState, useEffect, useCallback } from 'react';
import {
  fetchApprovalQueue,
  fetchApprovalStats,
  approveAdminStudent,
  rejectAdminStudent,
  fetchAdminStudentById,
  verifyAdminStudentEmail,
} from '../../services/adminApi';

// ─── Helpers ────────────────────────────────────────────────────────────────

function EmailBadge({ verified }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      ✓ Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      ⏳ Unverified
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Student Review Modal ────────────────────────────────────────────────────

function StudentReviewModal({ studentId, onClose, onApprove, onReject }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject'

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchAdminStudentById(studentId);
        setData(res);
      } catch (e) {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  async function handleConfirm() {
    try {
      if (confirmAction === 'approve') await onApprove(studentId);
      else if (confirmAction === 'reject') await onReject(studentId);
      onClose();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-900">Student Review</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-slate-500">Loading student details...</div>
        ) : !data ? (
          <div className="px-6 py-12 text-center text-red-600">Failed to load student details.</div>
        ) : (
          <div className="px-6 py-6 space-y-6">
            {/* Status banner */}
            <div className={`rounded-lg px-4 py-3 flex items-center gap-3 border ${data.email_verified ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">Email Verification</p>
                <p className={`text-sm ${data.email_verified ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {data.email_verified
                    ? 'Email has been verified. Student can be approved.'
                    : 'Email has NOT been verified. Approving will allow login only if email is later verified.'}
                </p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <EmailBadge verified={data.email_verified} />
                {!data.email_verified && (
                  <button
                    onClick={async () => {
                      if (!window.confirm("Manually verify this student's email address?")) return;
                      try {
                        await verifyAdminStudentEmail(studentId);
                        alert('Email verified successfully.');
                        const res = await fetchAdminStudentById(studentId);
                        setData(res);
                      } catch (e) {
                        alert(`Error: ${e.message}`);
                      }
                    }}
                    className="text-xs bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 px-2 py-1 rounded"
                  >
                    Verify Email
                  </button>
                )}
              </div>
            </div>

            {/* Personal Info */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Full Name', data.name],
                  ['Email', data.email],
                  ['Username', data.username],
                  ['Department', data.department || '—'],
                  ['Enrollment No.', data.enrollment_number || '—'],
                  ['Registration No.', data.registration_number || '—'],
                  ['Account Status', data.status],
                  ['Registered On', formatDate(data.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-slate-400">{label}</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5 break-all">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile snapshot */}
            {data.profile && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Profile Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-slate-400">Career Goal</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{data.profile.careerGoal || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-slate-400">Skills</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{data.profile.skills?.length || 0} recorded</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-slate-400">Projects</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{data.profile.projects?.length || 0} recorded</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-slate-400">Resume</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{data.profile.resumeFileUrl ? 'Uploaded' : 'Not uploaded'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm step */}
            {confirmAction ? (
              <div className={`rounded-xl border p-4 ${confirmAction === 'approve' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`font-semibold mb-1 ${confirmAction === 'approve' ? 'text-emerald-800' : 'text-red-800'}`}>
                  {confirmAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </p>
                <p className="text-sm text-slate-600 mb-4">
                  {confirmAction === 'approve'
                    ? `Approve ${data.name}? They will be allowed to log in once email is verified.`
                    : `Reject ${data.name}? Their data will be preserved but they cannot log in.`}
                </p>
                <div className="flex gap-3">
                  <button onClick={handleConfirm} className={confirmAction === 'approve' ? 'primary-button' : 'bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700'}>
                    Yes, {confirmAction === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                  <button onClick={() => setConfirmAction(null)} className="ghost-button text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setConfirmAction('approve')}
                  className="primary-button flex-1"
                >
                  ✓ Approve Student
                </button>
                <button
                  onClick={() => setConfirmAction('reject')}
                  className="flex-1 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function AdminStudentApprovalsPage() {
  const [queue, setQueue] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState(''); // '' | 'true' | 'false'
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Review modal
  const [reviewStudentId, setReviewStudentId] = useState(null);

  // Inline action feedback
  const [actionMsg, setActionMsg] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const evParam = emailVerifiedFilter === '' ? undefined : emailVerifiedFilter === 'true';
      const [queueRes, statsRes] = await Promise.all([
        fetchApprovalQueue({ search, emailVerified: evParam, department: departmentFilter || undefined }),
        fetchApprovalStats(),
      ]);
      setQueue(queueRes.students || []);
      setTotal(queueRes.total || 0);
      setStats(statsRes);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, emailVerifiedFilter, departmentFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleApprove(id) {
    await approveAdminStudent(id);
    setActionMsg({ type: 'success', text: 'Student approved successfully.' });
    setTimeout(() => setActionMsg(null), 3000);
    loadData();
  }

  async function handleReject(id) {
    await rejectAdminStudent(id);
    setActionMsg({ type: 'success', text: 'Student rejected.' });
    setTimeout(() => setActionMsg(null), 3000);
    loadData();
  }

  async function handleInlineAction(id, action, name) {
    const confirmed = window.confirm(`${action === 'approve' ? 'Approve' : 'Reject'} student "${name}"?`);
    if (!confirmed) return;
    try {
      if (action === 'approve') await handleApprove(id);
      else await handleReject(id);
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  }

  // Unique departments for filter dropdown
  const departments = [...new Set(queue.map(s => s.department).filter(Boolean))];

  return (
    <div className="page-content">
      {/* Review Modal */}
      {reviewStudentId && (
        <StudentReviewModal
          studentId={reviewStudentId}
          onClose={() => { setReviewStudentId(null); loadData(); }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Feedback toast */}
      {actionMsg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold border ${actionMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {actionMsg.text}
        </div>
      )}

      {/* Page header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Student Approvals</h2>
        <p className="text-slate-500 mt-1">Students waiting for administrative review and approval.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Pending Approval', value: stats?.pending ?? '…', color: 'amber' },
          { label: 'Email Verified', value: stats?.verifiedPending ?? '…', color: 'emerald' },
          { label: 'Email Unverified', value: stats?.unverifiedPending ?? '…', color: 'slate' },
          { label: 'Approved (7 days)', value: stats?.recentlyApproved ?? '…', color: 'blue' },
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
          className="input-field flex-1 min-w-[200px]"
          placeholder="Search name, email, enrollment, registration…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input-field w-44"
          value={emailVerifiedFilter}
          onChange={e => setEmailVerifiedFilter(e.target.value)}
        >
          <option value="">All (email)</option>
          <option value="true">Email Verified</option>
          <option value="false">Email Unverified</option>
        </select>
        <select
          className="input-field w-44"
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button onClick={loadData} className="ghost-button shrink-0">Refresh</button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="panel-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-600">
            {loading ? 'Loading…' : `${total} student${total !== 1 ? 's' : ''} pending approval`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Enrollment</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Email Verification</th>
                <th className="px-6 py-4">Registered</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">Loading pending students…</td></tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <span className="text-4xl">✓</span>
                      <p className="font-semibold">No pending approvals</p>
                      <p className="text-xs">All students have been reviewed.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                queue.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-400">{student.email}</div>
                      {!student.email_verified && (
                        <div className="text-xs text-amber-600 font-medium mt-0.5">⚠ Email not verified</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>{student.enrollment_number || '—'}</div>
                      <div className="text-xs text-slate-400">{student.registration_number || ''}</div>
                    </td>
                    <td className="px-6 py-4">{student.department || '—'}</td>
                    <td className="px-6 py-4">
                      <EmailBadge verified={student.email_verified} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(student.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setReviewStudentId(student.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleInlineAction(student.id, 'approve', student.name)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-semibold transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleInlineAction(student.id, 'reject', student.name)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-semibold transition-colors"
                        >
                          Reject
                        </button>
                      </div>
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

export default AdminStudentApprovalsPage;
