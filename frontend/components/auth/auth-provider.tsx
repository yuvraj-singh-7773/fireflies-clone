'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout as revokeSession } from '@/lib/api/auth';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/api/client';
import { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  completeLogin: (token: string, user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await revokeSession();
    } catch {
      // Local state must still be cleared if the network is unavailable.
    } finally {
      clearAccessToken();
      setUser(null);
      router.replace('/login');
    }
  }, [router]);

  const completeLogin = useCallback((token: string, authenticatedUser: User) => {
    setAccessToken(token);
    setUser(authenticatedUser);
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => clearAccessToken())
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('firefiles:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('firefiles:unauthorized', handleUnauthorized);
  }, []);

  const value = useMemo(() => ({ user, isLoading, completeLogin, logout }), [user, isLoading, completeLogin, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
