import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  fetchAdminStudents, 
  approveAdminStudent, 
  rejectAdminStudent, 
  suspendAdminStudent, 
  activateAdminStudent, 
  deleteAdminStudent, 
  resendAdminStudentVerification,
  createAdminStudent,
  updateAdminStudent
} from '../../services/adminApi';
import AdminStudentProfileModal from '../../components/admin/AdminStudentProfileModal';

function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  const [profileModalId, setProfileModalId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', username: '', password: '',
    enrollmentNumber: '', registrationNumber: '', department: ''
  });
  
  // Stats
  const activeCount = students.filter(s => s.status === 'ACTIVE').length;
  const pendingCount = students.filter(s => s.status === 'PENDING_APPROVAL').length;
  const unverifiedCount = students.filter(s => !s.email_verified).length;

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    try {
      const res = await fetchAdminStudents();
      setStudents(res.students || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (id, action, name) => {
    const isDestructive = action === 'delete' || action === 'suspend' || action === 'reject';
    if (isDestructive) {
      const confirmed = window.confirm(`Are you sure you want to ${action} student ${name}?`);
      if (!confirmed) return;
    }

    try {
      if (action === 'approve') await approveAdminStudent(id);
      else if (action === 'reject') await rejectAdminStudent(id);
      else if (action === 'suspend') await suspendAdminStudent(id);
      else if (action === 'activate') await activateAdminStudent(id);
      else if (action === 'delete') await deleteAdminStudent(id);
      else if (action === 'resend-verification') await resendAdminStudentVerification(id);
      
      await loadStudents(); // Reload list
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const filteredStudents = students.filter(s => {
    const term = search.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.enrollment_number && s.enrollment_number.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.department && s.department.toLowerCase().includes(term))
    );
  });

  return (
    <div className="page-content relative">
      <AdminStudentProfileModal studentId={profileModalId} onClose={() => setProfileModalId(null)} />
      {/* Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-bold mb-4 shrink-0">{editingId ? 'Edit Student' : 'Add New Student'}</h3>
            <div className="space-y-4 overflow-y-auto">
              <input type="text" placeholder="Full Name" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="email" placeholder="Email (@nita.ug.ac.in)" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input type="text" placeholder="Username" className="input-field" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              {!editingId && (
                <input type="password" placeholder="Password (min 8 chars)" className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              )}
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Enrollment No." className="input-field" value={formData.enrollmentNumber} onChange={e => setFormData({...formData, enrollmentNumber: e.target.value})} />
                <input type="text" placeholder="Registration No." className="input-field" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
              </div>
              <input type="text" placeholder="Department / Branch" className="input-field" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 mt-6 shrink-0">
              <button className="ghost-button" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="primary-button" onClick={async () => {
                try {
                  if (editingId) await updateAdminStudent(editingId, formData);
                  else await createAdminStudent(formData);
                  setShowModal(false);
                  loadStudents();
                } catch (err) { alert(err.message); }
              }}>
                {editingId ? 'Save Changes' : 'Create Student'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Student Management</h2>
          <p className="text-slate-600 mt-2">Manage all registered students across the platform.</p>
        </div>
        <button className="primary-button" onClick={() => {
          setEditingId(null);
          setFormData({ name: '', email: '', username: '', password: '', enrollmentNumber: '', registrationNumber: '', department: '' });
          setShowModal(true);
        }}>Add Student</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase">Total</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{students.length}</p>
        </div>
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-amber-400">
          <p className="text-sm font-semibold text-slate-500 uppercase">Pending Approval</p>
          <p className="text-4xl font-bold text-amber-600 mt-2">{pendingCount}</p>
        </div>
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-brand-500">
          <p className="text-sm font-semibold text-slate-500 uppercase">Unverified Email</p>
          <p className="text-4xl font-bold text-brand-600 mt-2">{unverifiedCount}</p>
        </div>
        <div className="panel-card flex flex-col items-center justify-center p-6 text-center border-b-4 border-emerald-500">
          <p className="text-sm font-semibold text-slate-500 uppercase">Active</p>
          <p className="text-4xl font-bold text-emerald-600 mt-2">{activeCount}</p>
        </div>
      </div>

      <div className="panel-card mb-6">
        <input 
          type="text"
          className="input-field max-w-md"
          placeholder="Search by name, email, enrollment, branch..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      ) : null}

      <div className="panel-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Enrollment</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">Loading students...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-500">{student.email}</div>
                    </td>
                    <td className="px-6 py-4">{student.enrollment_number || '—'}</td>
                    <td className="px-6 py-4">{student.department || '—'}</td>
                    <td className="px-6 py-4">
                      {student.email_verified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {student.status === 'ACTIVE' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          Active
                        </span>
                      )}
                      {student.status === 'PENDING_APPROVAL' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Awaiting Approval
                        </span>
                      )}
                      {student.status === 'PENDING_VERIFICATION' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Unverified
                        </span>
                      )}
                      {student.status === 'SUSPENDED' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setProfileModalId(student.id)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Profile</button>
                      
                      <button onClick={() => {
                        setEditingId(student.id);
                        setFormData({
                          name: student.name || '',
                          email: student.email || '',
                          username: student.username || '',
                          enrollmentNumber: student.enrollment_number || '',
                          registrationNumber: student.registration_number || '',
                          department: student.department || '',
                          password: ''
                        });
                        setShowModal(true);
                      }} className="text-brand-600 hover:text-brand-800 font-medium text-sm">Edit</button>
                      
                      {student.status === 'PENDING_APPROVAL' && (
                        <>
                          <button onClick={() => handleAction(student.id, 'approve', student.name)} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">Approve</button>
                          <button onClick={() => handleAction(student.id, 'reject', student.name)} className="text-red-600 hover:text-red-800 font-medium text-sm">Reject</button>
                        </>
                      )}
                      
                      {student.status === 'ACTIVE' && (
                        <button onClick={() => handleAction(student.id, 'suspend', student.name)} className="text-amber-600 hover:text-amber-800 font-medium text-sm">Suspend</button>
                      )}

                      {student.status === 'SUSPENDED' && (
                        <button onClick={() => handleAction(student.id, 'activate', student.name)} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">Activate</button>
                      )}
                      
                      {!student.email_verified && (
                        <button onClick={() => handleAction(student.id, 'resend-verification', student.name)} className="text-slate-500 hover:text-slate-700 font-medium text-sm">Resend</button>
                      )}

                      <button onClick={() => handleAction(student.id, 'delete', student.name)} className="text-red-600 hover:text-red-800 font-medium text-sm">Del</button>
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

export default AdminStudentsPage;
