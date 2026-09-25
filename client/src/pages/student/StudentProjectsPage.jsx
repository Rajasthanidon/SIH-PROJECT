import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { createStudentProject, fetchStudentProjects, submitStudentProject } from '../../services/studentApi';
import { readCacheSync } from '../../utils/cache';

const emptyProject = {
  title: '',
  description: '',
  githubUrl: '',
  liveUrl: '',
  technologies: '',
  studentContribution: '',
  duration: '',
  category: 'Product',
};

function StudentProjectsPage() {
  const cachedProj = readCacheSync('projects');
  const [projects, setProjects] = useState(cachedProj ? cachedProj.projects || [] : []);
  const [form, setForm] = useState(emptyProject);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(!cachedProj);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      try {
        setLoading(true);
        const setFormatted = (response) => {
          if (isMounted) setProjects(response.projects || []);
        };
        const response = await fetchStudentProjects(setFormatted);
        setFormatted(response);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load projects.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProjects();
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
      const payload = {
        ...form,
        technologies: form.technologies
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const response = await createStudentProject(payload);
      setProjects((current) => [response.project, ...current]);
      setForm(emptyProject);
      setShowForm(false);
    } catch (submitError) {
      setError(submitError.message || 'Unable to add project.');
    } finally {
      setSubmitting(false);
    }
  };

  async function handleSubmitForEvaluation(projectId) {
    try {
      setError('');
      const response = await submitStudentProject(projectId);
      setProjects((current) => current.map((project) => (
        project.id === projectId
          ? { ...project, status: 'submitted', evaluation: response.evaluation }
          : project
      )));
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit project for evaluation.');
    }
  }

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading projects…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="My projects" subtitle="Submit evidence-backed product work for evaluation.">
        <div className="mb-6 flex justify-end">
          <button type="button" onClick={() => setShowForm((current) => !current)} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white">
            {showForm ? 'Close form' : '+ Add Project'}
          </button>
        </div>

        {showForm ? (
          <form className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Project title" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows="3" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
            <input name="githubUrl" value={form.githubUrl} onChange={handleChange} placeholder="GitHub repository URL" className="rounded-lg border border-slate-300 px-3 py-2" />
            <input name="liveUrl" value={form.liveUrl} onChange={handleChange} placeholder="Live demo URL" className="rounded-lg border border-slate-300 px-3 py-2" />
            <input name="technologies" value={form.technologies} onChange={handleChange} placeholder="React, Node.js, PostgreSQL" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
            <input name="category" value={form.category} onChange={handleChange} placeholder="Project category" className="rounded-lg border border-slate-300 px-3 py-2" />
            <input name="duration" value={form.duration} onChange={handleChange} placeholder="Duration" className="rounded-lg border border-slate-300 px-3 py-2" />
            <textarea name="studentContribution" value={form.studentContribution} onChange={handleChange} placeholder="Student contribution" rows="3" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={submitting} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                {submitting ? 'Adding…' : 'Save project'}
              </button>
            </div>
          </form>
        ) : null}

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        {projects.length ? (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id || project.title} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-800">{project.title}</p>
                    <p className="text-sm text-slate-500">{project.category || 'Product'} • {project.status || 'draft'}</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">{project.status || 'draft'}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{project.description}</p>
                <p className="mt-2 text-sm text-slate-600"><span className="font-medium">Technologies:</span> {(project.technologies || []).join(', ') || 'N/A'}</p>
                <p className="mt-2 text-sm text-slate-600"><span className="font-medium">Contribution:</span> {project.studentContribution || 'N/A'}</p>
                {project.githubUrl || project.liveUrl ? (
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    {project.githubUrl ? <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-brand-700">Repository</a> : null}
                    {project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-brand-700">Demo</a> : null}
                  </div>
                ) : null}

                {project.evaluation ? (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <p className="font-semibold">Project evaluation</p>
                    <p>Overall score: {project.evaluation.score ?? project.evaluation.overallScore ?? 0}%</p>
                  </div>
                ) : null}

                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={() => handleSubmitForEvaluation(project.id)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                    Submit for evaluation
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No projects added yet.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default StudentProjectsPage;
