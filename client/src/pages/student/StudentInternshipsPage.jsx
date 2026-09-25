import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { createStudentInternship, fetchStudentInternships, submitStudentInternship } from '../../services/studentApi';
import { readCacheSync } from '../../utils/cache';

const emptyInternship = {
  company: '',
  role: '',
  duration: '',
  startDate: '',
  endDate: '',
  responsibilities: '',
  skillsUsed: '',
  description: '',
  evidence: '',
};

function StudentInternshipsPage() {
  const cachedInt = readCacheSync('internships');
  const [internships, setInternships] = useState(cachedInt ? cachedInt.internships || [] : []);
  const [form, setForm] = useState(emptyInternship);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(!cachedInt);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadInternships() {
      try {
        setLoading(true);
        const setFormatted = (response) => {
          if (isMounted) setInternships(response.internships || []);
        };
        const response = await fetchStudentInternships(setFormatted);
        setFormatted(response);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load internships.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInternships();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setForm((current) => ({
        ...current,
        evidence: file.name,
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...form,
        responsibilities: form.responsibilities.split(',').map((item) => item.trim()).filter(Boolean),
        skillsUsed: form.skillsUsed.split(',').map((item) => item.trim()).filter(Boolean),
      };

      const response = await createStudentInternship(payload);
      setInternships((current) => [response.internship, ...current]);
      setForm(emptyInternship);
      setShowForm(false);
    } catch (submitError) {
      setError(submitError.message || 'Unable to create internship entry.');
    } finally {
      setSubmitting(false);
    }
  };

  async function handleSubmitForEvaluation(internshipId) {
    try {
      setError('');
      const response = await submitStudentInternship(internshipId);
      setInternships((current) => current.map((internship) => (
        internship.id === internshipId
          ? { ...internship, status: 'submitted', evaluation: response.evaluation }
          : internship
      )));
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit internship for evaluation.');
    }
  }

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading internships…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="My internships" subtitle="Add role evidence and submit it for structured evaluation.">
        <div className="mb-6 flex justify-end">
          <button type="button" onClick={() => setShowForm((current) => !current)} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white">
            {showForm ? 'Close form' : '+ Add Internship'}
          </button>
        </div>

        {showForm ? (
          <form className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <input name="company" value={form.company} onChange={handleChange} placeholder="Company name" className="rounded-lg border border-slate-300 px-3 py-2" />
            <input name="role" value={form.role} onChange={handleChange} placeholder="Role" className="rounded-lg border border-slate-300 px-3 py-2" />
            <input name="startDate" value={form.startDate} onChange={handleChange} placeholder="Start date" className="rounded-lg border border-slate-300 px-3 py-2" />
            <input name="endDate" value={form.endDate} onChange={handleChange} placeholder="End date" className="rounded-lg border border-slate-300 px-3 py-2" />
            <input name="duration" value={form.duration} onChange={handleChange} placeholder="Duration" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
            <textarea name="responsibilities" value={form.responsibilities} onChange={handleChange} placeholder="Responsibilities (comma separated)" rows="3" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
            <textarea name="skillsUsed" value={form.skillsUsed} onChange={handleChange} placeholder="Skills used (comma separated)" rows="2" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows="3" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
            <div className="md:col-span-2 rounded-lg border border-dashed border-slate-300 bg-white p-3">
              <label className="block text-sm font-medium text-slate-700">Certificate / evidence upload</label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={handleFileChange} className="mt-2 block w-full text-sm text-slate-600" />
              {form.evidence ? <p className="mt-2 text-xs text-slate-500">Selected file: {form.evidence}</p> : null}
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={submitting} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                {submitting ? 'Adding…' : 'Save internship'}
              </button>
            </div>
          </form>
        ) : null}

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        {internships.length ? (
          <div className="space-y-4">
            {internships.map((internship) => (
              <div key={internship.id || internship.company} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-800">{internship.company}</p>
                    <p className="text-sm text-slate-500">{internship.role}</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">{internship.status || 'draft'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">Duration: {internship.duration || 'N/A'}</p>
                <p className="mt-1 text-sm text-slate-600">{internship.description || 'No description provided.'}</p>
                {internship.evidence ? <p className="mt-1 text-sm text-slate-600">Evidence: {internship.evidence}</p> : null}
                {internship.evaluation ? (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <p className="font-semibold">Internship evaluation</p>
                    <p>Overall score: {internship.evaluation.score ?? internship.evaluation.overallScore ?? 0}%</p>
                  </div>
                ) : null}

                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={() => handleSubmitForEvaluation(internship.id)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                    Submit for evaluation
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No internships recorded yet.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default StudentInternshipsPage;
