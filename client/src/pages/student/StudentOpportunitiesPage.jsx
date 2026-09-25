import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchActiveOpportunities } from '../../services/opportunitiesApi';
import SectionCard from '../../components/common/SectionCard';
import { readCacheSync } from '../../utils/cache';

export default function StudentOpportunitiesPage() {
  const cachedOpps = readCacheSync('opportunities_active', false);
  const [opportunities, setOpportunities] = useState(cachedOpps || []);
  const [loading, setLoading] = useState(!cachedOpps);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const loadOpportunities = async () => {
      try {
        setLoading(true);
        const setFormatted = (data) => { if(isMounted) setOpportunities(data); };
        const data = await fetchActiveOpportunities(false, setFormatted);
        setFormatted(data);
      } catch (err) {
        if (isMounted) setError('Failed to load opportunities');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadOpportunities();
    return () => { isMounted = false; };
  }, []);

  const filteredOpps = opportunities.filter(opp => {
    if (filter === 'ALL') return true;
    return opp.type === filter;
  });

  if (loading) return <div className="p-8">Loading opportunities...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Active Opportunities</h1>
          <p className="text-sm text-slate-500">Discover and apply to placement jobs and internships.</p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">{error}</div>}

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {['ALL', 'JOB', 'INTERNSHIP'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              filter === f 
                ? 'text-brand-700 border-b-2 border-brand-600 bg-brand-50' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {f === 'ALL' ? 'All' : f === 'JOB' ? 'Jobs' : 'Internships'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredOpps.length === 0 ? (
          <p className="text-slate-500 col-span-2 py-8 text-center">Currently there are no active opportunities.</p>
        ) : (
          filteredOpps.map(opp => (
            <SectionCard key={opp.id} className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{opp.title}</h3>
                  <p className="text-brand-700 font-medium">{opp.company_name}</p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {opp.type}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-6 flex-grow">
                <p>📍 {opp.location} • {opp.work_mode}</p>
                {opp.type === 'JOB' ? (
                  <p>💰 {opp.salary || 'Not specified'}</p>
                ) : (
                  <p>💰 {opp.stipend || 'Unpaid'}</p>
                )}
                <p>⏳ Deadline: {opp.application_deadline ? new Date(opp.application_deadline).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 mt-auto">
                <Link to={`/student/opportunities/${opp.id}`} className="primary-button text-sm px-4 py-2">
                  View Details
                </Link>
              </div>
            </SectionCard>
          ))
        )}
      </div>
    </div>
  );
}
