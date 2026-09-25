import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setCacheUserId, clearCache } from '../utils/cache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const AuthContext = createContext(null);

function getDashboardPathForRole(role) {
  if (!role) {
    return '/dashboard';
  }

  const dashboardMap = {
    student: '/student/dashboard',
    faculty: '/faculty/dashboard',
    placement: '/placement/dashboard',
    industry: '/industry/dashboard',
    admin: '/dashboard',
  };

  return dashboardMap[role] || '/dashboard';
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('portal-user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCacheUserId(parsedUser.id);
        return parsedUser;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [isReady, setIsReady] = useState(() => {
    try {
      return Boolean(localStorage.getItem('portal-user'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const hydrateUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const payload = await response.json();
          setUser(payload.user);
          setCacheUserId(payload.user.id);
          localStorage.setItem('portal-user', JSON.stringify(payload.user));
        } else {
          setUser(null);
          clearCache();
          localStorage.removeItem('portal-user');
        }
      } catch {
        setUser(null);
        clearCache();
        localStorage.removeItem('portal-user');
      } finally {
        setIsReady(true);
      }
    };

    hydrateUser();
  }, []);

  const persistUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      setCacheUserId(nextUser.id);
      localStorage.setItem('portal-user', JSON.stringify(nextUser));
    } else {
      clearCache();
      localStorage.removeItem('portal-user');
    }
  };

  const login = async ({ username, password }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error?.message || 'Login failed');
    }

    persistUser(payload.user);
    return payload;
  };

  const register = async (formData) => {
    const { role, ...data } = formData;
    const response = await fetch(`${API_BASE_URL}/auth/register/${role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error?.message || 'Registration failed');
    }

    return payload;
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      persistUser(null);
    }
  };

  const updateUser = (updates) => {
    if (!user) return;
    persistUser({ ...user, ...updates });
  };

  const value = useMemo(() => ({ user, isReady, login, register, logout, getDashboardPathForRole, updateUser }), [user, isReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

export { AuthProvider, useAuth };
