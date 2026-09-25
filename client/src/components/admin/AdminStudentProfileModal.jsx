import { useState, useEffect } from 'react';
import { fetchAdminStudentProfile } from '../../services/adminApi';

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

export default function AdminStudentProfileModal({ studentId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchAdminStudentProfile(studentId);
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-end z-50">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Student Profile Inspector</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500">Loading comprehensive profile...</div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">{error}</div>
          ) : (
            <div className="space-y-6">
              
              {/* Identity & Basic Info */}
              <div className="flex items-start gap-6 mb-8">
                {data.profile.profilePhoto ? (
                  <img src={data.profile.profilePhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-3xl font-bold shadow-sm">
                    {data.identity.name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900">{data.identity.name}</h3>
                  <p className="text-slate-500 mb-2">{data.identity.email} • {data.identity.username}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {data.identity.status}
                    </span>
                    {data.identity.email_verified && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Email Verified
                      </span>
                    )}
                    {data.profile.completion && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Profile: {data.profile.completion.percentage}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <Section title="Academic Details">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <DetailItem label="Enrollment Number" value={data.identity.enrollment_number} />
                  <DetailItem label="Registration Number" value={data.identity.registration_number} />
                  <DetailItem label="Department / Branch" value={data.identity.department || data.profile.academicInfo?.department} />
                  <DetailItem label="University" value={data.profile.academicInfo?.university} />
                  <DetailItem label="Degree" value={data.profile.academicInfo?.degree} />
                  <DetailItem label="CGPA" value={data.profile.academicInfo?.cgpa} />
                  <DetailItem label="Graduation Year" value={data.profile.academicInfo?.graduationYear} />
                </div>
              </Section>

              {/* Career Goal */}
              {(data.profile.careerGoal || data.profile.targetRole) && (
                <Section title="Career Objective">
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <DetailItem label="Target Role" value={data.profile.targetRole} />
                    <div className="mt-3">
                      <DetailItem label="Career Goal" value={data.profile.careerGoal} />
                    </div>
                  </div>
                </Section>
              )}

              {/* Skills */}
              {data.profile.skills && data.profile.skills.length > 0 && (
                <Section title="Skills & Assessments">
                  <div className="flex flex-wrap gap-2">
                    {data.profile.skills.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 shadow-sm">
                        {s.name}
                        {s.level > 0 && <span className="text-xs text-slate-400">({s.level}%)</span>}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Resume */}
              {data.profile.resumeFileUrl && (
                <Section title="Resume">
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center text-xl">📄</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">Uploaded Resume</p>
                      <p className="text-xs text-slate-500">
                        {data.profile.parsedSkills?.length > 0 ? `Parsed ${data.profile.parsedSkills.length} skills` : 'Document stored'}
                      </p>
                    </div>
                    <a href={data.profile.resumeFileUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-700 text-sm font-semibold">
                      View File &rarr;
                    </a>
                  </div>
                </Section>
              )}

              {/* Projects */}
              {data.profile.projects && data.profile.projects.length > 0 && (
                <Section title="Projects">
                  <div className="space-y-4">
                    {data.profile.projects.map((proj, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-bold text-slate-900">{proj.title}</h5>
                          {proj.link && <a href={proj.link} target="_blank" rel="noreferrer" className="text-xs text-brand-600">View Project</a>}
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{proj.description}</p>
                        {proj.technologies && proj.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {proj.technologies.map(tech => (
                              <span key={tech} className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{tech}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Internships */}
              {data.profile.internships && data.profile.internships.length > 0 && (
                <Section title="Internships">
                  <div className="space-y-4">
                    {data.profile.internships.map((int, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <h5 className="font-bold text-slate-900">{int.role} <span className="text-slate-400 font-normal">at</span> {int.company}</h5>
                        <p className="text-xs text-slate-500 mb-2">{int.duration}</p>
                        <p className="text-sm text-slate-600">{int.description}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Applications */}
              {data.applications && data.applications.length > 0 && (
                <Section title="Application History">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-600">Company</th>
                          <th className="px-4 py-3 font-semibold text-slate-600">Role</th>
                          <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                          <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.applications.map((app) => (
                          <tr key={app.id}>
                            <td className="px-4 py-3 text-slate-900 font-medium">{app.company_name}</td>
                            <td className="px-4 py-3 text-slate-600">{app.opportunity_title}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs uppercase">{app.opportunity_type}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
