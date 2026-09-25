import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { createStudentCertification, fetchStudentCertifications, fetchStudentProfile, updateStudentProfile } from '../../services/studentApi';
import { readCacheSync } from '../../utils/cache';

const emptyCertification = {
  name: '',
  issuer: '',
  year: new Date().getFullYear(),
  credentialUrl: '',
};

function StudentCertificationsPage() {
  const cachedCert = readCacheSync('certifications');
  const cachedProf = readCacheSync('profile');

  const [certifications, setCertifications] = useState(cachedCert ? cachedCert.certifications || [] : []);
  const [achievements, setAchievements] = useState(cachedProf ? cachedProf.profile?.portfolio?.highlights || [] : []);
  const [form, setForm] = useState(emptyCertification);
  const [achievementDraft, setAchievementDraft] = useState('');
  const [loading, setLoading] = useState(!(cachedCert && cachedProf));
  const [submitting, setSubmitting] = useState(false);
  const [submittingAch, setSubmittingAch] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const updateCerts = (res) => { if(isMounted && res) setCertifications(res.certifications || []); };
        const updateAch = (res) => { if(isMounted && res) setAchievements(res.profile?.portfolio?.highlights || []); };

        const [certRes, profileRes] = await Promise.all([
          fetchStudentCertifications(updateCerts),
          fetchStudentProfile(updateAch)
        ]);
        
        updateCerts(certRes);
        updateAch(profileRes);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await createStudentCertification(form);
      setCertifications((current) => [...current, response.certification]);
      setForm(emptyCertification);
    } catch (submitError) {
      setError(submitError.message || 'Unable to add certification.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAchievement = async (e) => {
    e.preventDefault();
    if (!achievementDraft.trim()) return;
    setSubmittingAch(true);
    try {
      const updatedHighlights = [...achievements, achievementDraft.trim()];
      await updateStudentProfile({ portfolio: { highlights: updatedHighlights } });
      setAchievements(updatedHighlights);
      setAchievementDraft('');
    } catch (err) {
      setError(err.message || 'Unable to add achievement.');
    } finally {
      setSubmittingAch(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading certifications…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Certifications" subtitle="Work and learning credentials">
        <form className="mb-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Certification name" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input name="issuer" value={form.issuer} onChange={handleChange} placeholder="Issuer" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input name="year" type="number" value={form.year} onChange={handleChange} placeholder="Year" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input name="credentialUrl" value={form.credentialUrl} onChange={handleChange} placeholder="Credential URL" className="rounded-lg border border-slate-300 px-3 py-2" />
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={submitting} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {submitting ? 'Adding…' : 'Add certification'}
            </button>
          </div>
        </form>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        {certifications.length ? (
          <div className="space-y-4">
            {certifications.map((certification) => (
              <div key={certification.id || certification.name} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-lg font-semibold text-slate-800">{certification.name}</p>
                  <span className="text-sm text-slate-500">{certification.year}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">Issuer: {certification.issuer}</p>
                {certification.credentialUrl ? <a href={certification.credentialUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-brand-700">View credential</a> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No certifications have been added yet.</p>
        )}
      </SectionCard>

      <SectionCard title="Achievements" subtitle="Awards, publications, or extracurricular highlights">
        <form className="mb-6 flex gap-3" onSubmit={handleAddAchievement}>
          <input value={achievementDraft} onChange={(e) => setAchievementDraft(e.target.value)} placeholder="e.g. Won 1st place in SIH 2024" className="flex-1 rounded-lg border border-slate-300 px-3 py-2" />
          <button type="submit" disabled={submittingAch} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {submittingAch ? 'Adding...' : 'Add highlight'}
          </button>
        </form>

        {achievements.length ? (
          <div className="space-y-2">
            {achievements.map((ach, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                • {ach}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No achievements added yet.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default StudentCertificationsPage;
