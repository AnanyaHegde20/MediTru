import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { mockUsers } from '../data/mockData';
import { UserProfile, UserRole } from '../types';

interface AuthContextValue {
  currentUser: UserProfile;
  isSidebarCollapsed: boolean;
  handleRoleChange: (role: UserRole) => void;
  handleLogin: (role: UserRole) => void;
  handleLogout: () => void;
  toggleSidebar: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getRoleFromPath(): UserRole | null {
  const segment = window.location.pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  if (segment === 'patient' || segment === 'doctor' || segment === 'admin') {
    return segment as UserRole;
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialRole = getRoleFromPath();
  const [currentUser, setCurrentUser] = useState<UserProfile>(
    initialRole ? mockUsers[initialRole] : mockUsers.patient
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Keep UI in sync when the browser back/forward buttons are used
  useEffect(() => {
    const onPopState = () => {
      const role = getRoleFromPath();
      setCurrentUser(role ? mockUsers[role] : mockUsers.patient);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleRoleChange = useCallback((role: UserRole) => {
    setCurrentUser(mockUsers[role]);
  }, []);

  const handleLogin = useCallback((role: UserRole) => {
    setCurrentUser(mockUsers[role]);
    window.history.pushState({ role }, '', `/${role}`);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(mockUsers.patient);
    window.history.pushState({}, '', '/');
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isSidebarCollapsed,
        handleRoleChange,
        handleLogin,
        handleLogout,
        toggleSidebar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
