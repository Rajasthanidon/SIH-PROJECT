import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchStudentDashboard, fetchStudentSkillGap } from '../../services/studentApi';
import { fetchNotifications, markNotificationRead, fetchActiveOpportunities } from '../../services/opportunitiesApi';
import { Link } from 'react-router-dom';
import { readCacheSync } from '../../utils/cache';

function StudentDashboardPage() {
  const cachedDash = readCacheSync('dashboard');
  const cachedGap = readCacheSync('skill-gap');
  const cachedOpps = readCacheSync('opportunities_active', false);
  const cachedNotif = readCacheSync('notifications_unread_true', false);

  const [dashboard, setDashboard] = useState(cachedDash ? cachedDash.dashboard : null);
  const [gapAnalysis, setGapAnalysis] = useState(cachedGap ? cachedGap.analysis : null);
  const [loading, setLoading] = useState(!cachedDash);
  const [error, setError] = useState('');
  
  const initialNotifs = cachedNotif && cachedNotif.length > 0 ? cachedNotif : [];
  const [notifications, setNotifications] = useState(initialNotifs);
  const [showNotification, setShowNotification] = useState(initialNotifs.length > 0);
  
  const initialJobs = cachedOpps ? cachedOpps.filter(o => o.type === 'JOB').length : 0;
  const initialIntern = cachedOpps ? cachedOpps.filter(o => o.type === 'INTERNSHIP').length : 0;
  const [activeOpps, setActiveOpps] = useState({ jobs: initialJobs, internships: initialIntern });

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');
        const updateDashboard = (fresh) => { 
          if(isMounted && fresh) setDashboard(fresh.dashboard); 
        };
        const updateGap = (fresh) => { 
          if(isMounted) setGapAnalysis(fresh?.analysis || null); 
        };
        const updateOpps = (fresh) => {
          if(isMounted && fresh) {
            const jobs = fresh.filter(o => o.type === 'JOB').length;
            const internships = fresh.filter(o => o.type === 'INTERNSHIP').length;
            setActiveOpps({ jobs, internships });
          }
        };
        const updateNotif = (fresh) => {
           if(isMounted) {
             if (fresh && fresh.length > 0) {
               setNotifications(fresh);
               setShowNotification(true);
             } else {
               setShowNotification(false);
             }
           }
        };

        const [dashboardResponse, gapResponse, notifResponse, activeOppsResponse] = await Promise.all([
          fetchStudentDashboard(updateDashboard),
          fetchStudentSkillGap(updateGap).catch(() => null),
          fetchNotifications(true, updateNotif).catch(() => []),
          fetchActiveOpportunities(false, updateOpps).catch(() => [])
        ]);

        if (dashboardResponse) updateDashboard(dashboardResponse);
        if (gapResponse) updateGap(gapResponse);
        if (notifResponse) updateNotif(notifResponse);
        if (activeOppsResponse) updateOpps(activeOppsResponse);

      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load dashboard data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading student dashboard…</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  if (!dashboard) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No dashboard data available yet.</div>;
  }

  const {
    overallReadiness = 0,
    targetRole = 'Not specified',
    skillOverview = [],
    topicPerformance = [],
    skillGaps = [],
    recommendedOpportunities = [],
    recentAssessments = [],
    selfDeclaredSkills = [],
    assessedSkills = [],
    projects = [],
    internships = [],
    technicalScore = 0,
    projectScore = 0,
    internshipScore = 0,
    overallScore = 0,
    currentRank = 0,
  } = dashboard;

  const matchedSkills = gapAnalysis?.matchedSkills || [];
  const partiallyMatchedSkills = gapAnalysis?.partiallyMatchedSkills || [];
  const priorityGaps = gapAnalysis?.priorityGaps || [];
  const recommendedImprovementAreas = gapAnalysis?.recommendedImprovementAreas || [];

  const handleDismissNotification = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notifications.length <= 1) setShowNotification(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {showNotification && notifications.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
          {notifications.map(notif => (
            <div key={notif.id} className="bg-white border-l-4 border-brand-600 rounded-lg shadow-xl p-4 flex gap-4 animate-fade-in-up">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                <div className="mt-3 flex gap-3">
                  {notif.type === 'NEW_OPPORTUNITY' && (
                    <Link to={`/student/opportunities/${notif.reference_id}`} className="text-brand-600 text-sm font-semibold hover:underline">
                      View Opportunity
                    </Link>
                  )}
                  {notif.type === 'APPLICATION_UPDATE' && (
                    <Link to="/student/applications" className="text-brand-600 text-sm font-semibold hover:underline">
                      View Applications
                    </Link>
                  )}
                  <button onClick={() => handleDismissNotification(notif.id)} className="text-slate-400 hover:text-slate-700 text-sm">
                    Dismiss
                  </button>
                </div>
              </div>
              <button onClick={() => handleDismissNotification(notif.id)} className="text-slate-400 hover:text-slate-700 self-start">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-600">Student</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Dashboard</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-6">
        <SectionCard title="Active Jobs" subtitle="Hiring now" className="md:col-span-1">
          <p className="text-3xl font-bold text-brand-700">{activeOpps.jobs}</p>
        </SectionCard>
        <SectionCard title="Active Internships" subtitle="Hiring now" className="md:col-span-1">
          <p className="text-3xl font-bold text-brand-700">{activeOpps.internships}</p>
        </SectionCard>
        <SectionCard title="Assessment" subtitle="Skill score" className="md:col-span-1">
          <p className="text-3xl font-bold text-slate-900">{technicalScore}%</p>
        </SectionCard>
        <SectionCard title="Projects" subtitle="Work score" className="md:col-span-1">
          <p className="text-3xl font-bold text-slate-900">{projectScore}%</p>
        </SectionCard>
        <SectionCard title="Experience" subtitle="Intern score" className="md:col-span-1">
          <p className="text-3xl font-bold text-slate-900">{internshipScore}%</p>
        </SectionCard>
        <SectionCard title="Overall" subtitle="Weighted result" className="md:col-span-1">
          <p className="text-3xl font-bold text-slate-900">{overallScore}%</p>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="My Skills" subtitle="Self-declared vs assessed">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Self-declared skills</p>
              <div className="flex flex-wrap gap-2">
                {selfDeclaredSkills.length ? selfDeclaredSkills.map((skill, index) => (
                  <span key={`${skill.name || 'skill'}-${index}`} className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-700">{skill.name || skill}</span>
                )) : <span className="text-sm text-slate-500">None yet.</span>}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Assessed skills</p>
              <div className="space-y-2">
                {assessedSkills.length ? assessedSkills.map((skill, index) => (
                  <div key={`${skill.name || 'assessed'}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="font-medium text-slate-800">{skill.name}</span>
                    <span className="text-sm text-brand-700">{typeof skill.score === 'number' ? `${skill.score}%` : 'Not assessed'}</span>
                  </div>
                )) : <p className="text-sm text-slate-500">No assessed results yet.</p>}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="My Performance" subtitle="Rank and current metrics">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm text-slate-500">Current rank</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">#{currentRank || 'N/A'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm text-slate-500">Target role</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{targetRole}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm text-slate-500">Overall readiness</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{overallReadiness}%</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="My Projects" subtitle="Portfolio evidence">
          {projects.length ? (
            <div className="space-y-3">
              {projects.slice(0, 4).map((project) => (
                <div key={project.id || project.title} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium text-slate-800">{project.title}</p>
                  <p className="text-sm text-slate-500">{project.status || 'draft'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No projects added yet.</p>
          )}
        </SectionCard>

        <SectionCard title="My Internships" subtitle="Experience evidence">
          {internships.length ? (
            <div className="space-y-3">
              {internships.slice(0, 4).map((internship) => (
                <div key={internship.id || internship.company} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium text-slate-800">{internship.company}</p>
                  <p className="text-sm text-slate-500">{internship.role} • {internship.status || 'draft'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No internships added yet.</p>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Skill gap analysis" subtitle={`Target role: ${targetRole}`}>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Matched skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {matchedSkills.length ? matchedSkills.map((skill) => (
                  <span key={skill.name} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{skill.name} {skill.current}%</span>
                )) : <span className="text-sm text-slate-500">No matched skills yet.</span>}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Partially matched</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {partiallyMatchedSkills.length ? partiallyMatchedSkills.map((skill) => (
                  <span key={skill.name} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">{skill.name} {skill.current}%</span>
                )) : <span className="text-sm text-slate-500">No partial gaps yet.</span>}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Priority gaps</p>
              <div className="mt-2 space-y-2">
                {priorityGaps.length ? priorityGaps.slice(0, 3).map((gap) => (
                  <div key={gap.name} className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-rose-900">{gap.name}</p>
                      <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold uppercase text-rose-700">{gap.priority}</span>
                    </div>
                    <p className="mt-1 text-sm text-rose-800">{gap.current}% / {gap.required}% • {gap.reason}</p>
                  </div>
                )) : <p className="text-sm text-slate-500">No major priority gaps.</p>}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Recommended opportunities" subtitle="Role-aligned suggestions">
          {recommendedOpportunities.length ? (
            <div className="space-y-3">
              {recommendedOpportunities.map((opportunity) => (
                <div key={opportunity.title} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-800">{opportunity.title}</p>
                    <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">{opportunity.match}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{opportunity.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recommendations available yet.</p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Recommended improvement areas" subtitle="Deterministic next steps">
        {recommendedImprovementAreas.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {recommendedImprovementAreas.map((item) => (
              <div key={item.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Priority {item.rank}</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{item.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.objective}</p>
                <p className="mt-2 text-sm text-slate-700">{item.action}</p>
                <p className="mt-2 text-xs text-slate-500">{item.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No improvement actions are necessary at this time.</p>
        )}
      </SectionCard>

      <SectionCard title="Recent assessments" subtitle="Latest evidence and scores">
        {recentAssessments.length ? (
          <div className="space-y-3">
            {recentAssessments.map((assessment) => (
              <div key={`${assessment.name}-${assessment.date}`} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{assessment.name}</p>
                  <p className="text-slate-500">{assessment.date}</p>
                </div>
                <span className="font-semibold text-slate-700">{assessment.score}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No recent assessments have been recorded.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default StudentDashboardPage;
