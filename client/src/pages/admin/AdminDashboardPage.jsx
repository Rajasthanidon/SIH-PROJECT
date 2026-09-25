import { useState, useEffect } from 'react';
import { fetchAdminStats } from '../../services/adminApi';

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchAdminStats();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="page-content">
        <h2 className="text-2xl font-bold mb-6">Admin Control Center</h2>
        <div className="panel-card flex justify-center items-center py-20 text-slate-500">
          <p>Loading platform statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <h2 className="text-2xl font-bold mb-6">Admin Control Center</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold">Failed to load statistics</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Platform Overview</h2>
        <p className="text-slate-600 mt-2">Central management and monitoring of all platform activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="panel-card flex flex-col items-start hover:border-slate-400 cursor-pointer">
          <div className="w-10 h-10 rounded bg-blue-50 text-blue-800 flex items-center justify-center mb-4 font-bold text-lg">
            S
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalStudents || 0}</p>
        </div>

        <div className="panel-card flex flex-col items-start hover:border-slate-400 cursor-pointer">
          <div className="w-10 h-10 rounded bg-amber-50 text-amber-700 flex items-center justify-center mb-4 font-bold text-lg">
            P
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending Students</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.pendingStudents || 0}</p>
        </div>

        <div className="panel-card flex flex-col items-start hover:border-slate-400 cursor-pointer">
          <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 font-bold text-lg">
            I
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Industry</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalIndustry || 0}</p>
        </div>

        <div className="panel-card flex flex-col items-start hover:border-slate-400 cursor-pointer">
          <div className="w-10 h-10 rounded bg-blue-50 text-blue-800 flex items-center justify-center mb-4 font-bold text-lg">
            F
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Faculty</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalFaculty || 0}</p>
        </div>

        <div className="panel-card flex flex-col items-start hover:border-slate-400 cursor-pointer">
          <div className="w-10 h-10 rounded bg-purple-50 text-purple-700 flex items-center justify-center mb-4 font-bold text-lg">
            PC
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Placement Cell</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalPlacementCell || 0}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-6">Opportunities & Content</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="panel-card flex flex-col items-start hover:border-slate-400 cursor-pointer">
          <div className="w-10 h-10 rounded bg-brand-50 text-brand-700 flex items-center justify-center mb-4 font-bold text-lg">
            J
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Jobs</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalJobs || 0}</p>
        </div>
        <div className="panel-card flex flex-col items-start hover:border-slate-400 cursor-pointer">
          <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 font-bold text-lg">
            In
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Internships</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalInternships || 0}</p>
        </div>
        <div className="panel-card flex flex-col items-start hover:border-slate-400 cursor-pointer">
          <div className="w-10 h-10 rounded bg-blue-50 text-blue-800 flex items-center justify-center mb-4 font-bold text-lg">
            A
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Applications</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalApplications || 0}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
