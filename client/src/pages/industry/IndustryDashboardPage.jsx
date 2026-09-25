import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchIndustryDashboard } from '../../services/industryApi';
import { fetchIndustryOpportunities } from '../../services/opportunitiesApi';
import { Link } from 'react-router-dom';

function IndustryDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [dashboardResponse, opportunitiesResponse] = await Promise.all([
        fetchIndustryDashboard(),
        fetchIndustryOpportunities().catch(() => []),
      ]);
      setDashboard(dashboardResponse.dashboard);
      setOpportunities(opportunitiesResponse || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load the industry dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Form handling removed in favor of dedicated pages

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading industry dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-600">Industry</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Dashboard</h1>
        </div>
      </div>

      {dashboard ? (
        <div className="grid gap-6 md:grid-cols-4">
          <SectionCard title="Company" subtitle="Profile status">
            <p className="text-3xl font-bold text-slate-900">{dashboard.company ? 'Live' : 'Needed'}</p>
          </SectionCard>
          <SectionCard title="Opportunities" subtitle="Total tracked">
            <p className="text-3xl font-bold text-slate-900">{dashboard.opportunityCount || 0}</p>
          </SectionCard>
          <SectionCard title="Published" subtitle="Live openings">
            <p className="text-3xl font-bold text-slate-900">{dashboard.publishedCount || 0}</p>
          </SectionCard>
          <SectionCard title="Applications" subtitle="Active review">
            <p className="text-3xl font-bold text-slate-900">{dashboard.activeApplications || 0}</p>
          </SectionCard>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Recent Opportunities" subtitle="Latest postings">
          {opportunities.length ? (
            <div className="space-y-3">
              {opportunities.slice(0, 5).map((opportunity) => (
                <div key={opportunity.id} className="rounded-lg border border-slate-200 p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-800">{opportunity.title}</p>
                    <p className="text-xs text-slate-500">{opportunity.type} • {opportunity.location || 'Remote'}</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-semibold uppercase text-brand-700">{opportunity.status}</span>
                </div>
              ))}
              <div className="pt-2">
                <Link to="/industry/opportunities" className="text-sm text-brand-600 font-medium hover:underline">
                  View all opportunities &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 mb-4">No opportunities have been posted yet.</p>
              <Link to="/industry/opportunities/new" className="primary-button text-sm">
                Post an Opportunity
              </Link>
            </div>
          )}
        </SectionCard>
        
        <SectionCard title="Quick Actions" subtitle="Manage your hiring">
          <div className="grid gap-3">
            <Link to="/industry/opportunities/new" className="p-4 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition block">
              <h3 className="font-medium text-slate-900">Post New Opportunity</h3>
              <p className="text-sm text-slate-500">Create a job or internship posting</p>
            </Link>
            <Link to="/industry/opportunities" className="p-4 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition block">
              <h3 className="font-medium text-slate-900">Manage Opportunities</h3>
              <p className="text-sm text-slate-500">Review applications and statuses</p>
            </Link>
            <Link to="/industry/candidates" className="p-4 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition block">
              <h3 className="font-medium text-slate-900">Find Candidates</h3>
              <p className="text-sm text-slate-500">Search student profiles</p>
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default IndustryDashboardPage;
