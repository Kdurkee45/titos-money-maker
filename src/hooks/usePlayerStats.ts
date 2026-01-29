/**
 * Hook for fetching and subscribing to player stats
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Player, PlayerStats, PlayerObservation } from '@/types/database';

interface PlayerWithStats {
  player: Player;
  stats: PlayerStats | null;
  observation: PlayerObservation | null;
}

interface UsePlayerStatsOptions {
  playerIds?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UsePlayerStatsReturn {
  players: Map<string, PlayerWithStats>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateObservation: (playerId: string, updates: Partial<PlayerObservation>) => Promise<void>;
}

export function usePlayerStats(
  options: UsePlayerStatsOptions = {}
): UsePlayerStatsReturn {
  const { playerIds = [], autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [players, setPlayers] = useState<Map<string, PlayerWithStats>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch player data
  const fetchPlayers = useCallback(async () => {
    if (playerIds.length === 0) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Fetch players
      const { data: playersData, error: playersError } = await (supabase as any)
        .from('players')
        .select('*')
        .in('id', playerIds);

      if (playersError) throw playersError;

      // Fetch stats
      const { data: statsData, error: statsError } = await (supabase as any)
        .from('player_stats')
        .select('*')
        .in('player_id', playerIds);

      if (statsError) throw statsError;

      // Fetch observations (user's own)
      const { data: obsData, error: obsError } = await (supabase as any)
        .from('player_observations')
        .select('*')
        .in('player_id', playerIds);

      if (obsError) throw obsError;

      // Combine data
      const statsMap = new Map((statsData as PlayerStats[])?.map(s => [s.player_id, s]) || []);
      const obsMap = new Map((obsData as PlayerObservation[])?.map(o => [o.player_id, o]) || []);

      const newPlayers = new Map<string, PlayerWithStats>();
      for (const player of (playersData as Player[]) || []) {
        newPlayers.set(player.id, {
          player,
          stats: statsMap.get(player.id) || null,
          observation: obsMap.get(player.id) || null,
        });
      }

      setPlayers(newPlayers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch players');
    } finally {
      setIsLoading(false);
    }
  }, [playerIds]);

  // Update observation
  const updateObservation = useCallback(async (
    playerId: string,
    updates: Partial<PlayerObservation>
  ) => {
    try {
      const { data: existing } = await (supabase as any)
        .from('player_observations')
        .select('id')
        .eq('player_id', playerId)
        .single();

      if (existing) {
        // Update existing
        await (supabase as any)
          .from('player_observations')
          .update(updates)
          .eq('player_id', playerId);
      } else {
        // Create new
        await (supabase as any)
          .from('player_observations')
          .insert({
            player_id: playerId,
            ...updates,
          });
      }

      // Refresh data
      await fetchPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update observation');
    }
  }, [fetchPlayers]);

  // Initial fetch
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || playerIds.length === 0) return;

    const interval = setInterval(fetchPlayers, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPlayers, playerIds.length]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (playerIds.length === 0) return;

    // Subscribe to player_stats changes
    const channel = supabase
      .channel('player-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_stats',
          filter: `player_id=in.(${playerIds.join(',')})`,
        },
        (payload) => {
          // Update local state with new stats
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newStats = payload.new as PlayerStats;
            setPlayers(prev => {
              const updated = new Map(prev);
              const existing = updated.get(newStats.player_id);
              if (existing) {
                updated.set(newStats.player_id, {
                  ...existing,
                  stats: newStats,
                });
              }
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerIds]);

  return {
    players,
    isLoading,
    error,
    refresh: fetchPlayers,
    updateObservation,
  };
}

/**
 * Hook for searching players
 */
interface SearchResult {
  id: string;
  site_player_id: string;
  poker_site: string;
  display_name: string | null;
  total_hands: number;
}

export function usePlayerSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (term: string, site?: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const { data, error } = await (supabase as any)
        .rpc('search_players', {
          p_search_term: term,
          p_poker_site: site || null,
          p_limit: 20,
        });

      if (error) throw error;
      setResults((data as SearchResult[]) || []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { results, isSearching, search };
}
