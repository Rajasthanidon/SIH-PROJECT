import { useState, useEffect } from 'react';
import { createAdminNotification, fetchAdminNotificationHistory } from '../../services/adminApi';

export default function AdminNotificationsPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'ADMIN_ANNOUNCEMENT',
    audience: 'ALL'
  });

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminNotificationHistory();
      setHistory(res.history || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);
      
      const res = await createAdminNotification(formData);
      setSuccessMsg(`Notification sent to ${res.created} users successfully!`);
      
      setFormData({
        title: '',
        message: '',
        type: 'ADMIN_ANNOUNCEMENT',
        audience: 'ALL'
      });
      
      loadHistory(); // reload history
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Announcements</h2>
          <p className="text-slate-600 mt-2">Send global or role-based notifications to platform users.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="panel-card sticky top-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">New Announcement</h3>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}
            
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience</label>
                <select 
                  name="audience" 
                  value={formData.audience} 
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="ALL">All Users</option>
                  <option value="student">All Students</option>
                  <option value="faculty">All Faculty</option>
                  <option value="industry">All Industry</option>
                  <option value="placement">All Placement Cell</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notification Type</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="ADMIN_ANNOUNCEMENT">General Announcement</option>
                  <option value="GLOBAL_ALERT">Important Alert</option>
                  <option value="GLOBAL_SYSTEM">System Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Platform Maintenance Tomorrow"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="input-field h-32 resize-none"
                  placeholder="Type your message here..."
                  required
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="btn-primary w-full py-3 mt-2 flex justify-center items-center"
              >
                {submitting ? 'Sending...' : 'Broadcast Notification'}
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="panel-card h-full">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Broadcast History</h3>
            
            {loading ? (
              <div className="text-center py-10 text-slate-500">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 text-slate-500">
                No global announcements have been sent yet.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide ${
                          item.type === 'GLOBAL_ALERT' ? 'bg-red-50 text-red-700 border border-red-200' :
                          item.type === 'GLOBAL_SYSTEM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {item.type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        {item.recipient_count} recipients
                      </span>
                    </div>
                    <h4 className="text-md font-bold text-slate-900 mt-2">{item.title}</h4>
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
