/**
 * Authentication hook for Supabase Auth
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, username?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      return false;
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    username?: string
  ): Promise<boolean> => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
          },
        },
      });

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      return false;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
      return false;
    }
  }, []);

  return {
    user,
    session,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
