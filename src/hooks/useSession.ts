/**
 * Hook for managing poker sessions
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, Hand, SessionInsert, HandInsert } from '@/types/database';

interface UseSessionOptions {
  sessionId?: string;
}

interface UseSessionReturn {
  session: Session | null;
  hands: Hand[];
  isLoading: boolean;
  error: string | null;
  createSession: (data: SessionInsert) => Promise<string | null>;
  endSession: () => Promise<void>;
  addHand: (data: HandInsert) => Promise<string | null>;
  refresh: () => Promise<void>;
}

export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const { sessionId } = options;
  
  const [session, setSession] = useState<Session | null>(null);
  const [hands, setHands] = useState<Hand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch session and hands
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Fetch hands
      const { data: handsData, error: handsError } = await supabase
        .from('hands')
        .select('*')
        .eq('session_id', sessionId)
        .order('played_at', { ascending: false });

      if (handsError) throw handsError;
      setHands(handsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Create a new session
  const createSession = useCallback(async (data: SessionInsert): Promise<string | null> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: newSession, error } = await supabase
        .from('sessions')
        .insert({
          ...data,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setSession(newSession);
      return newSession.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    }
  }, []);

  // End the current session
  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          ended_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      if (error) throw error;
      
      // Refresh to get updated session
      await fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  }, [session, fetchSession]);

  // Add a hand to the session
  const addHand = useCallback(async (data: HandInsert): Promise<string | null> => {
    if (!session) return null;

    try {
      const { data: newHand, error } = await supabase
        .from('hands')
        .insert({
          ...data,
          session_id: session.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add to local state
      setHands(prev => [newHand, ...prev]);
      
      // Update session hand count
      await supabase
        .from('sessions')
        .update({
          hands_played: hands.length + 1,
          profit_loss: hands.reduce((sum, h) => sum + h.profit, 0) + (newHand.profit || 0),
        })
        .eq('id', session.id);

      return newHand.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add hand');
      return null;
    }
  }, [session, hands]);

  // Initial fetch
  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, fetchSession]);

  // Subscribe to realtime hand updates
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hands',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newHand = payload.new as Hand;
          setHands(prev => [newHand, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return {
    session,
    hands,
    isLoading,
    error,
    createSession,
    endSession,
    addHand,
    refresh: fetchSession,
  };
}

/**
 * Hook for listing user's sessions
 */
export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, isLoading, error, refresh: fetchSessions };
}
