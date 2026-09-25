import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function PublicRoute({ children }) {
  const { user, isReady, getDashboardPathForRole } = useAuth();

  if (!isReady) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  if (user) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return children;
}

export default PublicRoute;
