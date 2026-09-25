import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../../components/common/SectionCard';
import { fetchStudentSkills, updateStudentSkills } from '../../services/studentApi';
import { readCacheSync } from '../../utils/cache';

function StudentSkillsPage() {
  const navigate = useNavigate();
  
  const cachedSkills = readCacheSync('skills');
  const initialSelf = cachedSkills ? (cachedSkills.selfDeclaredSkills || cachedSkills.skills || []) : [];
  const initialAssessed = cachedSkills ? (cachedSkills.assessedSkills || []) : [];
  const initialResume = cachedSkills ? (cachedSkills.resumeDetectedSkills || []) : [];

  const [selfDeclaredSkills, setSelfDeclaredSkills] = useState(initialSelf);
  const [assessedSkills, setAssessedSkills] = useState(initialAssessed);
  const [resumeDetectedSkills, setResumeDetectedSkills] = useState(initialResume);
  const [loading, setLoading] = useState(!cachedSkills);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadSkills() {
      try {
        setLoading(true);
        const setFormattedSkills = (response) => {
          if (!isMounted) return;
          setSelfDeclaredSkills(response.selfDeclaredSkills || response.skills || []);
          setAssessedSkills(response.assessedSkills || []);
          setResumeDetectedSkills(response.resumeDetectedSkills || []);
        };
        const response = await fetchStudentSkills(setFormattedSkills);
        setFormattedSkills(response);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load skills.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSkills();
    return () => { isMounted = false; };
  }, []);

  const handleAddSkill = async (skillName) => {
    const name = skillName?.trim?.() || draft.trim();
    if (!name || selfDeclaredSkills.find(s => s.name.toLowerCase() === name.toLowerCase())) {
      setDraft('');
      return;
    }

    try {
      const next = [...selfDeclaredSkills, { name, level: 50, confidence: 0.5 }];
      const response = await updateStudentSkills(next);
      setSelfDeclaredSkills(response.skills || next);
      if (!skillName) setDraft('');
      setError('');
    } catch (submitError) {
      setError(submitError.message || 'Unable to save skill.');
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading skills…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="My skills" subtitle="Self-declared skills are separate from assessed results.">
        <div className="mb-6 flex gap-3">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add a self-declared skill" className="flex-1 rounded-lg border border-slate-300 px-3 py-2" />
          <button type="button" onClick={handleAddSkill} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white">Add skill</button>
        </div>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Self-declared skills</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selfDeclaredSkills.length ? selfDeclaredSkills.map((skill, index) => (
                <span key={`${skill.name}-${index}`} className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-700">{skill.name}</span>
              )) : <span className="text-sm text-slate-500">No self-declared skills yet.</span>}
            </div>
          </div>

          <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Resume-detected skills</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {resumeDetectedSkills.length ? resumeDetectedSkills.map((skill, index) => (
                <button 
                  key={`resume-${skill.name}-${index}`} 
                  onClick={() => handleAddSkill(skill.name)}
                  className="rounded-full bg-white border border-brand-300 px-3 py-1 text-sm text-brand-800 hover:bg-brand-100 transition-colors flex items-center gap-1"
                  title="Click to add to Self-declared"
                >
                  {skill.name}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                </button>
              )) : <span className="text-sm text-brand-600/70">No skills detected. Upload your resume first.</span>}
            </div>
            <p className="mt-4 text-xs text-brand-600">Click a detected skill to add it to your self-declared profile.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Assessed skills</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {assessedSkills.length ? assessedSkills.map((skill, index) => (
                <div key={`${skill.name}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2">
                  <span className="font-medium text-slate-800">{skill.name}</span>
                  <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{typeof skill.score === 'number' ? `${skill.score}%` : 'Not assessed'}</span>
                </div>
              )) : <p className="text-sm text-slate-500 col-span-full">No assessed skill results yet.</p>}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={() => navigate('/student/assessments')} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Take skill assessment</button>
        </div>
      </SectionCard>
    </div>
  );
}

export default StudentSkillsPage;
