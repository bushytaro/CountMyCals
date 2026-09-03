import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  authError: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let timeoutId: number | undefined;

    const finishLoading = (nextSession: Session | null, error?: unknown) => {
      if (!isMounted) return;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthError(error ? 'Unable to connect to Supabase. Please try again.' : null);
      setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        finishLoading(currentSession);
      }
    );

    timeoutId = window.setTimeout(() => {
      finishLoading(null, new Error('Supabase session request timed out'));
    }, 12_000);

    // Initial fetch
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      finishLoading(initialSession);
    }).catch((error: unknown) => {
      console.error('Supabase session error:', error);
      finishLoading(null, error);
    });

    return () => {
      isMounted = false;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, authError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
