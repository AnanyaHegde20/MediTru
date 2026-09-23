import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { getToken, setToken } from '../lib/api';

interface AuthResult {
  error: string | null;
  user: UserProfile | null;
}

interface AuthContextValue {
  currentUser: UserProfile | null;
  authReady: boolean;
  isSidebarCollapsed: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<AuthResult>;
  handleLogout: () => void;
  toggleSidebar: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAuthUser(data: any): UserProfile {
  return {
    id: String(data.id),
    name: data.name,
    email: data.email,
    role: data.role,
    avatar: data.avatar || '',
    badge: data.badge || data.role,
    age: data.age ?? undefined,
    gender: data.gender ?? undefined,
    bloodGroup: data.bloodGroup ?? undefined,
    phone: data.phone ?? undefined,
    allergies: Array.isArray(data.allergies) ? data.allergies : [],
    medicalCondition: data.medicalCondition ?? undefined,
  };
}

async function postAuth(path: string, body: unknown): Promise<AuthResult> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: data.error || 'Authentication failed', user: null };
    }
    setToken(data.token);
    return { error: null, user: mapAuthUser(data.user) };
  } catch {
    return { error: 'Cannot reach the server. Is the backend running?', user: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        setAuthReady(true);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(mapAuthUser(data));
        } else {
          setToken(null);
        }
      } catch {
        setToken(null);
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await postAuth('/api/auth/login', { email, password });
    if (result.user) setCurrentUser(result.user);
    return result;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole): Promise<AuthResult> => {
      const result = await postAuth('/api/auth/register', { name, email, password, role });
      if (result.user) setCurrentUser(result.user);
      return result;
    },
    []
  );

  const handleLogout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authReady,
        isSidebarCollapsed,
        login,
        register,
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
