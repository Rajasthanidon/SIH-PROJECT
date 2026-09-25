import { useState, useEffect } from 'react';
import { fetchAdminApplicationById } from '../../services/adminApi';

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">{title}</h4>
      {children}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
      <p className="text-sm text-slate-900 font-medium">{value || '—'}</p>
    </div>
  );
}

export default function AdminApplicationModal({ applicationId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchAdminApplicationById(applicationId);
        setData(res.application);
      } catch (err) {
        setError(err.message || 'Failed to load application');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [applicationId]);

  if (!applicationId) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-end z-50">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Application Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500">Loading application...</div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">{error}</div>
          ) : (
            <div className="space-y-6">
              
              {/* Header Info */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                    {data.opportunity_type}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    data.status === 'SELECTED' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : data.status === 'REJECTED' || data.status === 'WITHDRAWN'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : data.status === 'SHORTLISTED'
                      ? 'bg-brand-50 text-brand-700 border-brand-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {data.status}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{data.opportunity_title}</h3>
                <p className="text-slate-600 font-medium">at {data.company_name}</p>
                
                <div className="mt-4 flex gap-4 text-sm text-slate-500 border-t border-b border-slate-100 py-3">
                  <div><span className="font-semibold text-slate-700">Applied on:</span> {new Date(data.created_at).toLocaleDateString()}</div>
                  <div><span className="font-semibold text-slate-700">Last updated:</span> {new Date(data.updated_at).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Applicant Info */}
              <Section title="Applicant (At Time of Application)">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <DetailItem label="Name" value={data.student_name} />
                  <DetailItem label="Email" value={data.student_email} />
                  
                  {data.profile_snapshot?.academic_info && (
                    <>
                      <DetailItem label="CGPA" value={data.profile_snapshot.academic_info.cgpa} />
                      <DetailItem label="Degree" value={data.profile_snapshot.academic_info.degree} />
                      <DetailItem label="Branch" value={data.profile_snapshot.academic_info.branch} />
                    </>
                  )}
                </div>
              </Section>

              {/* Snapshot Skills */}
              {data.profile_snapshot?.skills?.length > 0 && (
                <Section title="Skills (Snapshot)">
                  <div className="flex flex-wrap gap-2">
                    {data.profile_snapshot.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm font-medium">
                        {skill.name || skill}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
              
              {/* Snapshot Projects */}
              {data.profile_snapshot?.projects?.length > 0 && (
                <Section title="Projects (Snapshot)">
                  <div className="space-y-4">
                    {data.profile_snapshot.projects.map((proj, i) => (
                      <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <h5 className="font-bold text-slate-900">{proj.name}</h5>
                        <p className="text-sm text-slate-600 mt-1">{proj.description}</p>
                        {proj.technologies && (
                          <div className="mt-2 text-xs text-slate-500">Tech: {proj.technologies}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Snapshot Resume */}
              {data.profile_snapshot?.resume_file_url && (
                <Section title="Resume (Snapshot)">
                  <a href={data.profile_snapshot.resume_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-200 transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    View Original Submitted Resume
                  </a>
                </Section>
              )}

            </div>
          )}
        </div>
      </div>
      
      {/* Animation Styles */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
