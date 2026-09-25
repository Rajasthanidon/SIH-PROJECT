import Button from '../components/common/Button';
import SectionCard from '../components/common/SectionCard';

function HomePage() {
  return (
    <div className="space-y-8">
      <section className="hero-panel">
        <div className="max-w-2xl">
          <p className="eyebrow-text text-blue-100">Academia–Industry collaboration</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">Evidence-driven careers for every learner.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-blue-100">
            Align skill signals, assessments, internships, and role-fit data in one operational platform for students, faculty, recruiters, and placement teams.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" className="bg-white text-brand-700 hover:bg-slate-100">Student portal</Button>
            <Button variant="muted" className="border border-white/20 bg-transparent text-white hover:bg-white/10">Industry access</Button>
          </div>
        </div>

        <div className="hero-stat-grid">
          <div className="mini-stat">
            <span className="mini-stat-label">Skill readiness</span>
            <strong>82%</strong>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Active roles</span>
            <strong>146</strong>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Matched candidates</span>
            <strong>3.4k</strong>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <SectionCard title="Student" subtitle="Learning evidence and skill readiness.">
          <p className="text-sm leading-6 text-slate-600">Manage your profile, complete assessments, understand skill gaps, and track role-fit opportunities.</p>
        </SectionCard>
        <SectionCard title="Faculty" subtitle="Academic insight and mentorship planning.">
          <p className="text-sm leading-6 text-slate-600">Monitor student readiness, identify weak areas, and recommend focused training and workshops.</p>
        </SectionCard>
        <SectionCard title="Industry" subtitle="Role-fit and candidate discovery.">
          <p className="text-sm leading-6 text-slate-600">Publish openings, evaluate evidence-backed candidates, and manage applications with transparent scoring.</p>
        </SectionCard>
      </div>
    </div>
  );
}

export default HomePage;
