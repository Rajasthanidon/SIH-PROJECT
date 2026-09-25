import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchStudentPortfolio } from '../../services/studentApi';
import { readCacheSync } from '../../utils/cache';

function StudentPortfolioPage() {
  const cachedPort = readCacheSync('portfolio');
  const [portfolio, setPortfolio] = useState(cachedPort ? cachedPort.portfolio || null : null);
  const [loading, setLoading] = useState(!cachedPort);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadPortfolio() {
      try {
        setLoading(true);
        const setFormatted = (response) => {
          if (isMounted) setPortfolio(response.portfolio || null);
        };
        const response = await fetchStudentPortfolio(setFormatted);
        setFormatted(response);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load portfolio.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPortfolio();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading portfolio…</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  if (!portfolio) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No portfolio content available yet.</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Digital portfolio" subtitle="A concise representation of the student’s evidence and achievements">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-brand-600">Target role</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{portfolio.targetRole || 'Not specified'}</h2>
            </div>
            {portfolio.summary && (
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Executive Summary</p>
                <p className="mt-2 text-sm text-slate-700">{portfolio.summary}</p>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="font-medium text-slate-800">Academic information</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>University: {portfolio.academicInfo?.university || 'Not provided'}</li>
                <li>Degree: {portfolio.academicInfo?.degree || 'Not provided'}</li>
                <li>Department: {portfolio.academicInfo?.department || 'Not provided'}</li>
                <li>CGPA: {portfolio.academicInfo?.cgpa || 'Not provided'}</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="font-medium text-slate-800">Core skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(portfolio.skills || []).map((skill) => (
                  <span key={skill.name} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{skill.name}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <p className="font-medium text-slate-800">Projects</p>
            <div className="mt-3 space-y-3">
              {(portfolio.projects || []).map((project) => (
                <div key={project.id || project.title} className="rounded border border-slate-200 p-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">{project.title}</p>
                  <p>{project.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <p className="font-medium text-slate-800">Internships</p>
            <div className="mt-3 space-y-3">
              {(portfolio.internships || []).map((internship) => (
                <div key={internship.id || internship.company} className="rounded border border-slate-200 p-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">{internship.company} • {internship.role}</p>
                  <p>{internship.duration}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <p className="font-medium text-slate-800">Certifications</p>
            <div className="mt-3 space-y-3">
              {(portfolio.certifications || []).map((certification) => (
                <div key={certification.id || certification.name} className="rounded border border-slate-200 p-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">{certification.name}</p>
                  <p>{certification.issuer} • {certification.year}</p>
                </div>
              ))}
            </div>
          </div>

          {(portfolio.highlights && portfolio.highlights.length > 0) ? (
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="font-medium text-slate-800">Achievements</p>
              <div className="mt-3 space-y-2">
                {portfolio.highlights.map((ach, idx) => (
                  <div key={idx} className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    • {ach}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}

export default StudentPortfolioPage;
