import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchStudentEducation, createStudentEducation, deleteStudentEducation } from '../../services/studentApi';
import { readCacheSync } from '../../utils/cache';

const emptyEducation = {
  institutionName: '',
  degreeOrBoard: '',
  branchOrStream: '',
  startYear: '',
  endYear: '',
  scoreType: 'CGPA',
  score: '',
  educationLevel: 'Undergraduate',
};

function StudentEducationPage() {
  const cachedEdu = readCacheSync('education');
  const [educationList, setEducationList] = useState(cachedEdu ? cachedEdu.education || [] : []);
  const [form, setForm] = useState(emptyEducation);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(!cachedEdu);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadEducation() {
      try {
        setLoading(true);
        const setFormatted = (response) => {
          if (isMounted) setEducationList(response.education || []);
        };
        const response = await fetchStudentEducation(setFormatted);
        setFormatted(response);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load education records.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEducation();
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
      const response = await createStudentEducation(form);
      setEducationList((current) => [response.education, ...current]);
      setForm(emptyEducation);
      setShowForm(false);
    } catch (submitError) {
      setError(submitError.message || 'Unable to add education record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (educationId) => {
    if (!window.confirm('Are you sure you want to delete this education record?')) return;
    try {
      await deleteStudentEducation(educationId);
      setEducationList((current) => current.filter((item) => item.id !== educationId));
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete education record.');
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading education records…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="My Education" subtitle="Add your academic background (Class 10, Class 12, Diploma, Undergraduate, etc.)">
        <div className="mb-6 flex justify-end">
          <button type="button" onClick={() => setShowForm((current) => !current)} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
            {showForm ? 'Close form' : '+ Add Education'}
          </button>
        </div>

        {showForm ? (
          <form className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="space-y-1 text-sm text-slate-700">
              <span>Education Level</span>
              <select name="educationLevel" value={form.educationLevel} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white">
                <option value="Class 10">Class 10</option>
                <option value="Class 12">Class 12</option>
                <option value="Diploma">Diploma</option>
                <option value="Undergraduate">Undergraduate / Bachelor's</option>
                <option value="Postgraduate">Postgraduate / Master's</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span>Institution / School Name</span>
              <input name="institutionName" value={form.institutionName} onChange={handleChange} placeholder="e.g. ABC College of Engineering" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            
            <label className="space-y-1 text-sm text-slate-700">
              <span>Degree / Board</span>
              <input name="degreeOrBoard" value={form.degreeOrBoard} onChange={handleChange} placeholder="e.g. B.Tech / CBSE / State Board" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>

            {(form.educationLevel !== 'Class 10' && form.educationLevel !== 'Class 12') ? (
              <label className="space-y-1 text-sm text-slate-700">
                <span>Branch / Stream (optional)</span>
                <input name="branchOrStream" value={form.branchOrStream} onChange={handleChange} placeholder="e.g. Computer Science" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
            ) : (
              <div className="hidden md:block"></div>
            )}

            <label className="space-y-1 text-sm text-slate-700">
              <span>Start Year</span>
              <input name="startYear" type="number" min="1990" max="2030" value={form.startYear} onChange={handleChange} placeholder="e.g. 2020" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span>End Year / Expected</span>
              <input name="endYear" type="number" min="1990" max="2035" value={form.endYear} onChange={handleChange} placeholder="e.g. 2024" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>

            <label className="space-y-1 text-sm text-slate-700">
              <span>Score Type</span>
              <select name="scoreType" value={form.scoreType} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white">
                <option value="CGPA">CGPA</option>
                <option value="Percentage">Percentage</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span>Score / Grade</span>
              <input name="score" value={form.score} onChange={handleChange} placeholder={form.scoreType === 'CGPA' ? "e.g. 8.5" : "e.g. 85"} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>

            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={submitting} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:bg-brand-800">
                {submitting ? 'Saving…' : 'Save Education'}
              </button>
            </div>
          </form>
        ) : null}

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        {educationList.length ? (
          <div className="space-y-4">
            {educationList.map((ed) => (
              <div key={ed.id} className="rounded-lg border border-slate-200 p-4 relative group">
                <button 
                  onClick={() => handleDelete(ed.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-800">{ed.institutionName}</p>
                    <p className="text-sm font-medium text-brand-700">{ed.degreeOrBoard} {ed.branchOrStream ? `- ${ed.branchOrStream}` : ''}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{ed.educationLevel}</span>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-500">Duration:</span> {ed.startYear} - {ed.endYear || 'Present'}</p>
                  {ed.score && (
                    <p><span className="font-medium text-slate-500">Score:</span> {ed.score} {ed.scoreType === 'Percentage' ? '%' : 'CGPA'}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No education records added yet.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default StudentEducationPage;
