import { useState, useEffect } from 'react';
import { fetchAdminOpportunityById, updateAdminOpportunityStatus } from '../../services/adminApi';

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

export default function AdminOpportunityModal({ opportunityId, onClose, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchAdminOpportunityById(opportunityId);
        setData(res.opportunity);
      } catch (err) {
        setError(err.message || 'Failed to load opportunity');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [opportunityId]);

  if (!opportunityId) return null;

  const handleStatusUpdate = async (newStatus) => {
    const isDestructive = ['CLOSED', 'EXPIRED'].includes(newStatus);
    if (isDestructive && !window.confirm(`Are you sure you want to change status to ${newStatus}?`)) {
      return;
    }
    
    try {
      setStatusUpdating(true);
      await updateAdminOpportunityStatus(opportunityId, newStatus);
      setData(prev => ({ ...prev, status: newStatus }));
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-end z-50">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Opportunity Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500">Loading opportunity...</div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">{error}</div>
          ) : (
            <div className="space-y-6">
              
              {/* Header Info */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                    {data.type}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    data.status === 'PUBLISHED' || data.status === 'ACTIVE' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : data.status === 'DRAFT'
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {data.status}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{data.title}</h3>
                <p className="text-slate-600 font-medium">{data.company_name} <span className="text-slate-400 font-normal ml-2">({data.industry_email})</span></p>
                <div className="mt-4 flex gap-4 text-sm text-slate-500 border-t border-b border-slate-100 py-3">
                  <div><span className="font-semibold text-slate-700">Created:</span> {new Date(data.created_at).toLocaleDateString()}</div>
                  {data.application_deadline && (
                    <div><span className="font-semibold text-slate-700">Deadline:</span> {new Date(data.application_deadline).toLocaleDateString()}</div>
                  )}
                  <div><span className="font-semibold text-slate-700">Applications:</span> {data.applicationCount}</div>
                </div>
              </div>

              {/* Core Details */}
              <Section title="Overview">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <DetailItem label="Location" value={data.location} />
                  <DetailItem label="Work Mode" value={data.work_mode} />
                  <DetailItem label="Openings" value={data.openings} />
                  
                  {data.type === 'JOB' && (
                    <>
                      <DetailItem label="Salary" value={data.salary} />
                      <DetailItem label="Employment Type" value={data.employment_type} />
                    </>
                  )}
                  {data.type === 'INTERNSHIP' && (
                    <>
                      <DetailItem label="Duration" value={data.internship_duration} />
                      <DetailItem label="Stipend" value={data.stipend} />
                      <DetailItem label="PPO Available" value={data.ppo_available ? 'Yes' : 'No'} />
                    </>
                  )}
                </div>
              </Section>

              {/* Content text */}
              <Section title="Description">
                <div className="text-sm text-slate-700 whitespace-pre-wrap">{data.description}</div>
              </Section>
              
              {data.responsibilities && (
                <Section title="Responsibilities">
                  <div className="text-sm text-slate-700 whitespace-pre-wrap">{data.responsibilities}</div>
                </Section>
              )}

              {/* Eligibility */}
              <Section title="Eligibility & Requirements">
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <DetailItem label="Minimum CGPA" value={data.min_cgpa} />
                  <DetailItem label="Experience Req." value={data.experience_requirement} />
                  
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 font-medium mb-1">Allowed Branches</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.allowed_branches?.length > 0 
                        ? data.allowed_branches.map(b => <span key={b} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700">{b}</span>)
                        : <span className="text-sm text-slate-900">Any</span>}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 font-medium mb-1">Batch Eligibility</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.batch_eligibility?.length > 0 
                        ? data.batch_eligibility.map(b => <span key={b} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700">{b}</span>)
                        : <span className="text-sm text-slate-900">Any</span>}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Skills */}
              {data.required_skills?.length > 0 && (
                <Section title="Required Skills">
                  <div className="flex flex-wrap gap-2">
                    {data.required_skills.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
              
              {/* Admin Moderation Actions */}
              <div className="border-t border-slate-200 pt-6 mt-8">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Admin Moderation</h4>
                <div className="flex flex-wrap gap-3">
                  <button 
                    disabled={statusUpdating || data.status === 'PUBLISHED'} 
                    onClick={() => handleStatusUpdate('PUBLISHED')}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 font-medium text-sm rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Mark Published
                  </button>
                  <button 
                    disabled={statusUpdating || data.status === 'CLOSED'} 
                    onClick={() => handleStatusUpdate('CLOSED')}
                    className="px-4 py-2 bg-amber-50 text-amber-700 font-medium text-sm rounded-lg hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Close Opportunity
                  </button>
                  <button 
                    disabled={statusUpdating || data.status === 'EXPIRED'} 
                    onClick={() => handleStatusUpdate('EXPIRED')}
                    className="px-4 py-2 bg-red-50 text-red-700 font-medium text-sm rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Mark Expired
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Note: Closing or expiring an opportunity preserves all historical application data. It prevents new students from applying.
                </p>
              </div>

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
