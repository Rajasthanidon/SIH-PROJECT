import { useEffect, useState } from 'react';
import SectionCard from '../../components/common/SectionCard';
import { fetchAssessmentLeaderboard, fetchCurrentAssessmentRank } from '../../services/assessmentApi';
import { readCacheSync } from '../../utils/cache';

function StudentLeaderboardPage() {
  const cachedLeaderboard = readCacheSync('assessment_leaderboard', false);
  const cachedRank = readCacheSync('assessment_rank');

  const [entries, setEntries] = useState(cachedLeaderboard ? (cachedLeaderboard.entries || []) : []);
  const [rank, setRank] = useState(cachedRank ? (cachedRank.rank || cachedRank || null) : null);
  const [loading, setLoading] = useState(!(cachedLeaderboard && cachedRank));
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadLeaderboard() {
      try {
        setLoading(true);
        const updateEntries = (res) => { if (isMounted && res) setEntries(res.entries || []); };
        const updateRank = (res) => { if (isMounted && res) setRank(res.rank || res || null); };
        
        const [leaderboardResponse, rankResponse] = await Promise.all([
          fetchAssessmentLeaderboard(updateEntries),
          fetchCurrentAssessmentRank(updateRank),
        ]);

        updateEntries(leaderboardResponse);
        updateRank(rankResponse);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'Unable to load leaderboard.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLeaderboard();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading leaderboard…</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Leaderboard" subtitle="Current ranking by normalized overall score">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Your current rank</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {rank && rank.rank !== null ? `#${rank.rank}` : 'Unranked'}
          </p>
          {rank && rank.score !== undefined ? <p className="text-sm text-slate-600">Score: {rank.score}%</p> : null}
        </div>
      </SectionCard>

      <SectionCard title="Rankings" subtitle="Global leaderboard derived from stored backend scores">
        <div className="space-y-3">
          {entries.length ? entries.map((entry) => (
            <div key={`${entry.userId}-${entry.role}-${entry.rank}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
              <div>
                <p className="font-semibold text-slate-800">#{entry.rank} {entry.student}</p>
                <p className="text-sm text-slate-500">{entry.role}</p>
              </div>
              <span className="text-lg font-bold text-brand-700">{entry.score}%</span>
            </div>
          )) : <p className="text-sm text-slate-500">No leaderboard entries are available yet.</p>}
        </div>
      </SectionCard>
    </div>
  );
}

export default StudentLeaderboardPage;
