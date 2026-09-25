import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOpportunityDetails, applyForOpportunity, fetchStudentApplications } from '../../services/opportunitiesApi';
import { fetchStudentProfile } from '../../services/studentApi';
import SectionCard from '../../components/common/SectionCard';
import { readCacheSync } from '../../utils/cache';

export default function StudentOpportunityDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const cachedOpp = readCacheSync(`opportunity_${id}`, false);
  const cachedApps = readCacheSync('applications_student');

  const [opp, setOpp] = useState(cachedOpp || null);
  const [loading, setLoading] = useState(!(cachedOpp && cachedApps));
  const [error, setError] = useState('');
  
  const initialApp = cachedApps ? cachedApps.find(a => a.opportunity_id === parseInt(id, 10)) : null;
  const [applicationStatus, setApplicationStatus] = useState(initialApp ? initialApp.status : null);
  
  // Application preview state
  const [showPreview, setShowPreview] = useState(false);
  const [profile, setProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const updateOpp = (res) => { if (isMounted && res) setOpp(res); };
        const updateApps = (res) => { 
          if (isMounted && res) {
             const existingApp = res.find(a => a.opportunity_id === parseInt(id, 10));
             if (existingApp) setApplicationStatus(existingApp.status);
          } 
        };

        const [oppData, apps] = await Promise.all([
          fetchOpportunityDetails(id, updateOpp),
          fetchStudentApplications(updateApps)
        ]);
        
        updateOpp(oppData);
        updateApps(apps);
      } catch (err) {
        if (isMounted) setError('Failed to load details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [id]);

  const handleApplyClick = async () => {
    try {
      setLoading(true);
      const prof = await fetchStudentProfile();
      setProfile(prof.profile || prof);
      setShowPreview(true);
    } catch (err) {
      setError('Failed to load profile for application');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!profile.resumeFileUrl) {
      setError('Resume is required to apply. Please update your profile.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      await applyForOpportunity(id);
      setApplicationStatus('APPLIED');
      setShowPreview(false);
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!opp) return <div className="p-8 text-red-600">Opportunity not found.</div>;

  const isExpired = opp.application_deadline && new Date(opp.application_deadline) < new Date();

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/student/opportunities')} className="text-sm font-medium text-slate-500 hover:text-brand-600">
        ← Back to Opportunities
      </button>

      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">{error}</div>}

      <SectionCard>
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{opp.title}</h1>
            <p className="text-xl text-brand-700 mt-1">{opp.company_name}</p>
            <div className="flex flex-wrap gap-3 mt-4 text-sm text-slate-600">
              <span className="px-3 py-1 bg-slate-100 rounded-full border border-slate-200">{opp.type}</span>
              <span className="px-3 py-1 bg-slate-100 rounded-full border border-slate-200">{opp.location}</span>
              <span className="px-3 py-1 bg-slate-100 rounded-full border border-slate-200">{opp.work_mode}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl min-w-[200px]">
            {applicationStatus ? (
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">Application Status</p>
                <p className="font-bold text-brand-700">{applicationStatus}</p>
              </div>
            ) : isExpired ? (
              <div className="text-center">
                <p className="text-sm text-red-600 font-bold mb-1">Expired</p>
                <p className="text-xs text-slate-500">Applications closed</p>
              </div>
            ) : (
              <button 
                onClick={handleApplyClick}
                className="w-full primary-button"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{opp.description}</p>
            </div>
            
            {opp.responsibilities && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Responsibilities</h3>
                <p className="text-slate-700 whitespace-pre-wrap">{opp.responsibilities}</p>
              </div>
            )}
            
            {opp.preferred_qualifications && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Preferred Qualifications</h3>
                <p className="text-slate-700 whitespace-pre-wrap">{opp.preferred_qualifications}</p>
              </div>
            )}
          </div>

          <div className="space-y-6 bg-slate-50 p-5 rounded-xl border border-slate-200 h-fit">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Key Details</h4>
              <ul className="space-y-3 text-sm text-slate-700">
                {opp.type === 'JOB' ? (
                  <>
                    <li><strong>Salary:</strong> {opp.salary || 'Not specified'}</li>
                    <li><strong>Employment:</strong> {opp.employment_type || 'Full-time'}</li>
                  </>
                ) : (
                  <>
                    <li><strong>Stipend:</strong> {opp.stipend || 'Unpaid'}</li>
                    <li><strong>Duration:</strong> {opp.internship_duration || 'Not specified'}</li>
                    {opp.ppo_available && <li className="text-green-600 font-medium">✓ PPO Available</li>}
                  </>
                )}
                <li><strong>Deadline:</strong> {opp.application_deadline ? new Date(opp.application_deadline).toLocaleDateString() : 'N/A'}</li>
                <li><strong>Openings:</strong> {opp.openings || 'Not specified'}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Required Skills</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {(opp.required_skills || []).map((skill, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-700">
                    {skill}
                  </span>
                ))}
                {(!opp.required_skills || opp.required_skills.length === 0) && <span className="text-sm text-slate-500">Not specified</span>}
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Eligibility</h4>
              <ul className="space-y-1 text-sm text-slate-700">
                {opp.min_cgpa && <li><strong>Min CGPA:</strong> {opp.min_cgpa}</li>}
                {opp.allowed_branches?.length > 0 && <li><strong>Branches:</strong> {opp.allowed_branches.join(', ')}</li>}
              </ul>
            </div>
          </div>
        </div>
      </SectionCard>

      {showPreview && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">Application Preview</h2>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-500">Applying for</p>
                <p className="font-bold text-slate-900">{opp.title} at {opp.company_name}</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-2">Student Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block">Name</span>
                    <span className="font-medium">{profile.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Branch</span>
                    <span className="font-medium">{profile.academicInfo?.department || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CGPA</span>
                    <span className="font-medium">{profile.academicInfo?.cgpa || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Graduation Year</span>
                    <span className="font-medium">{profile.academicInfo?.graduationYear || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-2">Resume</h3>
                {profile.resumeFileUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                    <span>📄</span>
                    <span className="text-sm font-medium">Uploaded Resume</span>
                    <span className="text-green-600 text-xs ml-auto">✓ Ready</span>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    Resume is required to apply. Please update your profile first.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => navigate('/student/resume')} className="ghost-button">
                Edit Resume
              </button>
              <button 
                onClick={handleConfirmSubmit} 
                disabled={submitting || !profile.resumeFileUrl}
                className="primary-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
