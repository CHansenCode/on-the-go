import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { mockLogin } from '../api/mock';
import { AuthUser, Session } from './types';

const SESSION_KEY = 'on-the-go.session';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      if (raw) {
        setSession(JSON.parse(raw) as Session);
      }
    } catch {
      // Corrupt or inaccessible entry — treat as logged out.
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    setError(null);
    try {
      // TODO: once main-frame's real auth endpoint is up, branch on
      // USE_MOCK_API (src/api/config.ts) and call
      // apiFetch('/auth/login', null, { method: 'POST', body: {...} })
      // instead of mockLogin.
      const next = await mockLogin(username, password);
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next));
      setSession(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setSession(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isLoading,
      error,
      login,
      logout,
    }),
    [session, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
