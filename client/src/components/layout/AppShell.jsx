import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AppShell() {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Overview', to: '/', exact: true },
    ...(user ? [{ label: 'Dashboard', to: '/dashboard', exact: false }] : [{ label: 'Login', to: '/login', exact: false }]),
    ...(user?.role === 'student'
      ? [
          { label: 'Student Dashboard', to: '/student/dashboard', exact: false },
          { label: 'Active Opportunities', to: '/student/opportunities', exact: false },
          { label: 'My Applications', to: '/student/applications', exact: false },
          { label: 'Profile', to: '/student/profile', exact: false },
          { label: 'Resume', to: '/student/resume', exact: false },
          { label: 'Education', to: '/student/education', exact: false },
          { label: 'Projects', to: '/student/projects', exact: false },
          { label: 'Internships', to: '/student/internships', exact: false },
          { label: 'Certifications', to: '/student/certifications', exact: false },
          { label: 'Skills', to: '/student/skills', exact: false },
          { label: 'Topics', to: '/student/topics', exact: false },
          { label: 'Portfolio', to: '/student/portfolio', exact: false },
          { label: 'Recommendations', to: '/student/recommendations', exact: false },
        ]
      : []),
    ...(user?.role === 'faculty'
      ? [
          { label: 'Faculty Dashboard', to: '/faculty/dashboard', exact: false },
          { label: 'Students', to: '/faculty/students', exact: false },
          { label: 'Analytics', to: '/faculty/analytics', exact: false },
        ]
      : []),
    ...(user?.role === 'placement'
      ? [
          { label: 'Placement Dashboard', to: '/placement/dashboard', exact: false },
          { label: 'Students', to: '/placement/students', exact: false },
          { label: 'Analytics', to: '/placement/analytics', exact: false },
        ]
      : []),
    ...(user?.role === 'industry'
      ? [
          { label: 'Industry Dashboard', to: '/industry/dashboard', exact: false },
          { label: 'Company', to: '/industry/company', exact: false },
          { label: 'Opportunities', to: '/industry/opportunities', exact: false },
          { label: 'Candidates', to: '/industry/candidates', exact: false },
          { label: 'Applications', to: '/industry/applications', exact: false },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [
          { label: 'Admin Dashboard',   to: '/admin/dashboard',          exact: false },
          { label: 'Student Approvals', to: '/admin/student-approvals',  exact: false },
          { label: 'Students',          to: '/admin/students',           exact: false },
          { label: 'Faculty',           to: '/admin/faculty',            exact: false },
          { label: 'Industry',          to: '/admin/industry',           exact: false },
          { label: 'Placement Cell',    to: '/admin/placement-cell',     exact: false },
          { label: 'Jobs',              to: '/admin/jobs',               exact: false },
          { label: 'Internships',       to: '/admin/internships',        exact: false },
          { label: 'Applications',      to: '/admin/applications',       exact: false },
          { label: 'Analytics',         to: '/admin/analytics',          exact: false },
          { label: 'Announcements',     to: '/admin/notifications',      exact: false },
          { label: 'Audit Logs',        to: '/admin/audit-logs',         exact: false },
          { label: 'Settings',          to: '/admin/settings',           exact: false },
        ]
      : []),
  ];

  const pageTitle = user ? `${user.role?.charAt(0).toUpperCase()}${user.role?.slice(1)}` : 'Portal';

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <div className="brand-mark">C</div>
          <div>
            <p className="brand-label">CareerBridge</p>
            <p className="brand-subtitle">Talent Platform</p>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">Navigation</p>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {user ? (
          <div className="sidebar-user-card">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name} className="avatar-badge object-cover" />
            ) : (
              <div className="avatar-badge">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            )}
            <div>
              <p className="user-name">{user.name || 'User'}</p>
              <p className="user-role">{pageTitle}</p>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow-text">{user ? 'Role workspace' : 'Public access'}</p>
            <h1 className="topbar-title">{user ? `${pageTitle} workspace` : 'Career technology platform'}</h1>
          </div>

          <div className="topbar-actions">
            {user ? (
              <button type="button" className="ghost-button" onClick={() => logout()}>
                Logout
              </button>
            ) : (
              <>
                <NavLink to="/login" className="ghost-button">Login</NavLink>
                <NavLink to="/register" className="primary-button">Register</NavLink>
              </>
            )}
          </div>
        </header>

        <main className="page-shell">
          <div className="page-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
