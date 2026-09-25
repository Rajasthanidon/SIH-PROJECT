import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchCompanyProfile, saveCompanyProfile } from '../../services/industryApi';

const emptyCompany = {
  companyName: '',
  industry: '',
  website: '',
  location: '',
  description: '',
};

function IndustryCompanyPage() {
  const [company, setCompany] = useState(emptyCompany);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCompany() {
      try {
        const response = await fetchCompanyProfile();
        setCompany({
          ...emptyCompany,
          ...(response.company || {}),
        });
      } catch (loadError) {
        setError(loadError.message || 'Unable to load company profile.');
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCompany((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await saveCompanyProfile(company);
      setCompany({
        ...emptyCompany,
        ...(response.company || {}),
      });
    } catch (submitError) {
      setError(submitError.message || 'Unable to save company profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading company profile…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Company profile" subtitle="Publish your employer identity and hiring context">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              <span>Company name</span>
              <input name="companyName" value={company.companyName || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Industry</span>
              <input name="industry" value={company.industry || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Website</span>
              <input name="website" value={company.website || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Location</span>
              <input name="location" value={company.location || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
            </label>
          </div>

          <label className="block space-y-2 text-sm text-slate-700">
            <span>Description</span>
            <textarea name="description" rows="5" value={company.description || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save company profile'}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

export default IndustryCompanyPage;
