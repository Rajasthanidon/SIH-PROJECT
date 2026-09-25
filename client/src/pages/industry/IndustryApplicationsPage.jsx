import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchIndustryApplications, submitApplicationFeedback } from '../../services/industryApi';

function IndustryApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadApplications() {
    try {
      setLoading(true);
      const response = await fetchIndustryApplications();
      setApplications(response.applications || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load applications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const updateFeedback = async (applicationId, status) => {
    try {
      const text = window.prompt('Provide recruiter feedback', 'Strong alignment with the role and good technical readiness.');
      if (!text) {
        return;
      }

      await submitApplicationFeedback(applicationId, {
        status,
        feedback: text,
      });
      await loadApplications();
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit feedback.');
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading applications…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Application management" subtitle="Review, shortlist, and provide structured feedback">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        {applications.length ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-900">{application.candidateName}</p>
                    <p className="text-sm text-brand-600 font-medium">{application.jobTitle}</p>
                    <p className="text-sm text-slate-600">Email: {application.candidateEmail}</p>
                    <p className="text-sm text-slate-600">Applied: {new Date(application.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm font-semibold mt-2">Status: <span className="text-brand-700">{application.status}</span></p>
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    {application.resumeUrl ? (
                      <a 
                        href={`http://localhost:4000${application.resumeUrl}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm text-brand-600 hover:underline mb-2"
                      >
                        📄 View Resume
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400 mb-2">No Resume</span>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => updateFeedback(application.id, 'SELECTED')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">Select</button>
                      <button type="button" onClick={() => updateFeedback(application.id, 'REJECTED')} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">Reject</button>
                    </div>
                  </div>
                </div>
                {application.feedback && (
                  <p className="mt-4 text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
                    <strong>Feedback:</strong> {application.feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No applications have been recorded yet.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default IndustryApplicationsPage;
