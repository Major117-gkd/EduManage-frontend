import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { getHomePathForRole } from '../utils/rolePaths';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const profil = location.pathname.startsWith('/student') ? 'eleve'
      : location.pathname.startsWith('/parent') ? 'parent'
      : undefined;
    const loginPath = profil ? `/login?profil=${profil}` : '/login';
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    const home = getHomePathForRole(user?.role);
    return <Navigate to={home} replace />;
  }

  return children;
}
