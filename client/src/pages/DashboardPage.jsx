import SectionCard from '../components/common/SectionCard';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';

const roleContent = {
  student: {
    title: 'Student dashboard',
    summary: 'Track your evidence, gaps, and opportunities.',
  },
  faculty: {
    title: 'Faculty dashboard',
    summary: 'Monitor student readiness and mentorship decisions.',
  },
  placement: {
    title: 'Placement dashboard',
    summary: 'Manage drives, applications, and candidate readiness.',
  },
  industry: {
    title: 'Industry dashboard',
    summary: 'Review candidate fit and published opportunities.',
  },
  admin: {
    title: 'Admin dashboard',
    summary: 'Govern users, institutions, and integrations.',
  },
};

function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const panel = roleContent[role] || roleContent.student;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow-text">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{panel.title}</h1>
        </div>
        <StatusBadge label={user?.role || 'student'} tone="success" />
      </div>

      <SectionCard title="Current user" subtitle={panel.summary}>
        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Name</span><span className="mt-2 block font-medium text-slate-900">{user?.name || 'Unknown user'}</span></div>
          <div className="rounded-xl bg-slate-50 p-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Email</span><span className="mt-2 block font-medium text-slate-900">{user?.email || 'Not available'}</span></div>
          <div className="rounded-xl bg-slate-50 p-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Role</span><span className="mt-2 block font-medium text-slate-900">{user?.role || 'student'}</span></div>
        </div>
      </SectionCard>

      <div className="grid gap-6 md:grid-cols-3">
        <SectionCard title="Assessment readiness" subtitle="Current evidence layer">
          <p className="text-3xl font-bold tracking-tight text-slate-900">76%</p>
        </SectionCard>
        <SectionCard title="Skill gaps" subtitle="Priority topics">
          <p className="text-3xl font-bold tracking-tight text-slate-900">4</p>
        </SectionCard>
        <SectionCard title="Opportunity fit" subtitle="Role matching">
          <p className="text-3xl font-bold tracking-tight text-slate-900">82%</p>
        </SectionCard>
      </div>
    </div>
  );
}

export default DashboardPage;
