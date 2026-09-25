import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchIndustryOpportunities } from '../../services/opportunitiesApi';
import SectionCard from '../../components/common/SectionCard';

export default function IndustryOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      const data = await fetchIndustryOpportunities();
      setOpportunities(data);
    } catch (err) {
      setError('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading opportunities...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Opportunities</h1>
          <p className="text-sm text-slate-500">Manage jobs and internships posted by your company.</p>
        </div>
        <Link to="/industry/opportunities/new" className="primary-button">
          Post New Opportunity
        </Link>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">{error}</div>}

      <SectionCard>
        {opportunities.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">You haven't posted any opportunities yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">Title</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Posted On</th>
                  <th className="px-4 py-3 font-semibold">Deadline</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold rounded-tr-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {opportunities.map(opp => (
                  <tr key={opp.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">{opp.title}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs bg-slate-100 border border-slate-200 rounded">{opp.type}</span>
                    </td>
                    <td className="px-4 py-3">{new Date(opp.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{opp.application_deadline ? new Date(opp.application_deadline).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border
                        ${opp.status === 'PUBLISHED' || opp.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${opp.status === 'DRAFT' ? 'bg-slate-100 text-slate-700 border-slate-200' : ''}
                        ${opp.status === 'CLOSED' || opp.status === 'EXPIRED' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                      `}>
                        {opp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/industry/opportunities/${opp.id}`} className="text-brand-600 hover:text-brand-800 font-medium">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
