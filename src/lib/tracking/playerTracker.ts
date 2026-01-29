/**
 * Player Tracking System
 * 
 * Handles the dynamic nature of online poker tables where:
 * - Players can leave and join at any time
 * - Each seat may have different players hand-to-hand
 * - We need to track behavioral profiles separately for each unique player
 * - On anonymous tables (like Ignition), we use stack + behavior as identifiers
 * 
 * Key Concepts:
 * - SEAT: A fixed position at the table (1-9 for 9-max, 1-6 for 6-max)
 * - PLAYER: A unique entity with behavioral history
 * - OCCUPANCY: The association of a player to a seat for a period of time
 */

import { supabase } from '@/lib/supabase';

export interface SeatState {
  seatNumber: number;
  isOccupied: boolean;
  playerName: string | null;  // null for anonymous tables
  stackSize: number | null;
  lastSeenStackSize: number | null;
  currentPlayerId: string | null;  // UUID of the player record
  isSittingOut: boolean;
  lastAction: string | null;
  lastActionTime: number | null;
}

export interface PlayerFingerprint {
  // For anonymous tables, we use these to identify players
  initialStackSize: number;
  seatNumber: number;
  sessionStartTime: number;
  // Behavioral markers that develop over time
  vpipHands: number;
  pfrHands: number;
  totalHands: number;
  aggressionFactor: number;
}

export interface PlayerChange {
  type: 'join' | 'leave' | 'return' | 'stackChange';
  seatNumber: number;
  previousPlayerId: string | null;
  newPlayerId: string | null;
  timestamp: number;
  details: {
    previousStack?: number;
    newStack?: number;
    playerName?: string;
  };
}

export interface TrackerConfig {
  maxSeats: number;
  isAnonymous: boolean;
  sessionId: string;
  userId: string;
  // Stack change threshold to detect rebuy vs normal play
  rebuySuspicionThreshold: number;  // e.g., 0.5 = 50% stack increase in one hand
}

/**
 * PlayerTracker class manages the dynamic state of all seats at a poker table
 */
export class PlayerTracker {
  private seats: Map<number, SeatState> = new Map();
  private playerFingerprints: Map<string, PlayerFingerprint> = new Map();
  private config: TrackerConfig;
  private changeHistory: PlayerChange[] = [];
  private handNumber: number = 0;

  constructor(config: TrackerConfig) {
    this.config = config;
    this.initializeSeats();
  }

  /**
   * Initialize all seats as empty
   */
  private initializeSeats(): void {
    for (let i = 1; i <= this.config.maxSeats; i++) {
      this.seats.set(i, {
        seatNumber: i,
        isOccupied: false,
        playerName: null,
        stackSize: null,
        lastSeenStackSize: null,
        currentPlayerId: null,
        isSittingOut: false,
        lastAction: null,
        lastActionTime: null,
      });
    }
  }

  /**
   * Update the state of a seat based on OCR data
   * Returns any player changes detected
   */
  async updateSeat(
    seatNumber: number,
    ocrData: {
      playerName?: string | null;
      stackSize?: number | null;
      isSittingOut?: boolean;
      hasCards?: boolean;
    }
  ): Promise<PlayerChange | null> {
    const seat = this.seats.get(seatNumber);
    if (!seat) return null;

    const previousState = { ...seat };
    const now = Date.now();

    // Case 1: Seat was empty, now has a player
    if (!seat.isOccupied && ocrData.stackSize !== null) {
      const change = await this.handlePlayerJoin(seat, ocrData, now);
      return change;
    }

    // Case 2: Seat was occupied, now empty
    if (seat.isOccupied && ocrData.stackSize === null && !ocrData.hasCards) {
      const change = await this.handlePlayerLeave(seat, now);
      return change;
    }

    // Case 3: Player appears to have changed (different stack than expected)
    if (seat.isOccupied && ocrData.stackSize !== null) {
      const stackDelta = seat.lastSeenStackSize 
        ? (ocrData.stackSize - seat.lastSeenStackSize) / seat.lastSeenStackSize
        : 0;

      // Check for suspicious stack increase (potential new player)
      if (stackDelta > this.config.rebuySuspicionThreshold) {
        // Could be a rebuy OR a new player
        // For anonymous tables, we treat large stack increases as potential new player
        if (this.config.isAnonymous && Math.abs(stackDelta) > 1) {
          const change = await this.handlePotentialPlayerChange(seat, ocrData, now);
          if (change) return change;
        }
      }

      // Update stack size
      seat.stackSize = ocrData.stackSize;
      seat.lastSeenStackSize = ocrData.stackSize;
      seat.isSittingOut = ocrData.isSittingOut ?? false;

      // Update player fingerprint
      if (seat.currentPlayerId) {
        this.updatePlayerFingerprint(seat.currentPlayerId, {
          currentStack: ocrData.stackSize,
        });
      }
    }

    // Case 4: Sitting out status changed
    if (seat.isSittingOut !== (ocrData.isSittingOut ?? false)) {
      seat.isSittingOut = ocrData.isSittingOut ?? false;
      
      if (seat.isSittingOut) {
        return {
          type: 'leave',
          seatNumber,
          previousPlayerId: seat.currentPlayerId,
          newPlayerId: seat.currentPlayerId, // Same player, just sitting out
          timestamp: now,
          details: { previousStack: seat.stackSize ?? undefined },
        };
      } else {
        return {
          type: 'return',
          seatNumber,
          previousPlayerId: seat.currentPlayerId,
          newPlayerId: seat.currentPlayerId,
          timestamp: now,
          details: { newStack: seat.stackSize ?? undefined },
        };
      }
    }

    return null;
  }

  /**
   * Handle a new player joining a seat
   */
  private async handlePlayerJoin(
    seat: SeatState,
    ocrData: { playerName?: string | null; stackSize?: number | null },
    timestamp: number
  ): Promise<PlayerChange> {
    // Create or find the player in the database
    const playerId = await this.getOrCreatePlayer(
      ocrData.playerName ?? `Seat ${seat.seatNumber}`,
      ocrData.stackSize ?? 0
    );

    seat.isOccupied = true;
    seat.playerName = ocrData.playerName ?? null;
    seat.stackSize = ocrData.stackSize ?? null;
    seat.lastSeenStackSize = ocrData.stackSize ?? null;
    seat.currentPlayerId = playerId;
    seat.isSittingOut = false;

    // Create fingerprint for anonymous identification
    this.playerFingerprints.set(playerId, {
      initialStackSize: ocrData.stackSize ?? 0,
      seatNumber: seat.seatNumber,
      sessionStartTime: timestamp,
      vpipHands: 0,
      pfrHands: 0,
      totalHands: 0,
      aggressionFactor: 0,
    });

    const change: PlayerChange = {
      type: 'join',
      seatNumber: seat.seatNumber,
      previousPlayerId: null,
      newPlayerId: playerId,
      timestamp,
      details: {
        newStack: ocrData.stackSize ?? undefined,
        playerName: ocrData.playerName ?? undefined,
      },
    };

    this.changeHistory.push(change);
    return change;
  }

  /**
   * Handle a player leaving a seat
   */
  private async handlePlayerLeave(
    seat: SeatState,
    timestamp: number
  ): Promise<PlayerChange> {
    const change: PlayerChange = {
      type: 'leave',
      seatNumber: seat.seatNumber,
      previousPlayerId: seat.currentPlayerId,
      newPlayerId: null,
      timestamp,
      details: {
        previousStack: seat.lastSeenStackSize ?? undefined,
      },
    };

    // Clear seat state
    seat.isOccupied = false;
    seat.playerName = null;
    seat.stackSize = null;
    seat.currentPlayerId = null;
    seat.isSittingOut = false;
    seat.lastAction = null;
    seat.lastActionTime = null;

    this.changeHistory.push(change);
    return change;
  }

  /**
   * Handle potential player change (for anonymous tables)
   */
  private async handlePotentialPlayerChange(
    seat: SeatState,
    ocrData: { playerName?: string | null; stackSize?: number | null },
    timestamp: number
  ): Promise<PlayerChange | null> {
    // For anonymous tables, a massive stack increase could indicate:
    // 1. A rebuy by the same player
    // 2. A completely new player sitting down
    
    // Heuristics to detect new player:
    // - Stack is close to a "standard" buy-in (100bb, 50bb, etc.)
    // - Previous player just went all-in and lost
    
    const previousPlayerId = seat.currentPlayerId;
    const previousStack = seat.lastSeenStackSize ?? 0;
    const newStack = ocrData.stackSize ?? 0;

    // If new stack is more than 2x the previous (and previous was low),
    // likely a new player
    if (newStack > previousStack * 2 && previousStack < newStack * 0.3) {
      // Create new player record
      const newPlayerId = await this.getOrCreatePlayer(
        ocrData.playerName ?? `Seat ${seat.seatNumber}`,
        newStack
      );

      seat.currentPlayerId = newPlayerId;
      seat.stackSize = newStack;
      seat.lastSeenStackSize = newStack;
      seat.playerName = ocrData.playerName ?? null;

      // Create new fingerprint
      this.playerFingerprints.set(newPlayerId, {
        initialStackSize: newStack,
        seatNumber: seat.seatNumber,
        sessionStartTime: timestamp,
        vpipHands: 0,
        pfrHands: 0,
        totalHands: 0,
        aggressionFactor: 0,
      });

      const change: PlayerChange = {
        type: 'join',
        seatNumber: seat.seatNumber,
        previousPlayerId,
        newPlayerId,
        timestamp,
        details: {
          previousStack,
          newStack,
          playerName: ocrData.playerName ?? undefined,
        },
      };

      // Also record the leave of the previous player
      if (previousPlayerId) {
        this.changeHistory.push({
          type: 'leave',
          seatNumber: seat.seatNumber,
          previousPlayerId,
          newPlayerId: null,
          timestamp: timestamp - 1, // Slightly before
          details: { previousStack },
        });
      }

      this.changeHistory.push(change);
      return change;
    }

    return null;
  }

  /**
   * Get or create a player record in the database
   */
  private async getOrCreatePlayer(
    name: string,
    initialStack: number
  ): Promise<string> {
    try {
      // For anonymous tables, we always create a new session-specific player
      // For non-anonymous, we look up by name
      if (this.config.isAnonymous) {
        // Create a session-specific player record
        const { data, error } = await supabase
          .from('players')
          .insert({
            name: name,
            site: 'ignition', // TODO: make configurable
            is_anonymous: true,
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            created_by: this.config.userId,
          })
          .select('id')
          .single();

        if (error) throw error;
        return data.id;
      } else {
        // Try to find existing player by name
        const { data: existingPlayer } = await supabase
          .from('players')
          .select('id')
          .eq('name', name)
          .eq('created_by', this.config.userId)
          .single();

        if (existingPlayer) {
          // Update last_seen
          await supabase
            .from('players')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', existingPlayer.id);
          return existingPlayer.id;
        }

        // Create new player
        const { data, error } = await supabase
          .from('players')
          .insert({
            name,
            site: 'unknown',
            is_anonymous: false,
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            created_by: this.config.userId,
          })
          .select('id')
          .single();

        if (error) throw error;
        return data.id;
      }
    } catch (error) {
      console.error('Failed to get/create player:', error);
      // Return a temporary UUID for local tracking
      return crypto.randomUUID();
    }
  }

  /**
   * Update a player's behavioral fingerprint
   */
  private updatePlayerFingerprint(
    playerId: string,
    update: {
      currentStack?: number;
      vpipAction?: boolean;
      pfrAction?: boolean;
      aggressiveAction?: boolean;
    }
  ): void {
    const fingerprint = this.playerFingerprints.get(playerId);
    if (!fingerprint) return;

    if (update.vpipAction) {
      fingerprint.vpipHands++;
      fingerprint.totalHands++;
    }
    if (update.pfrAction) {
      fingerprint.pfrHands++;
    }
    if (update.aggressiveAction) {
      // Simple aggression tracking
      fingerprint.aggressionFactor = 
        (fingerprint.aggressionFactor * fingerprint.totalHands + 1) / 
        (fingerprint.totalHands + 1);
    }
  }

  /**
   * Record a player action
   */
  recordAction(
    seatNumber: number,
    action: string,
    amount?: number
  ): void {
    const seat = this.seats.get(seatNumber);
    if (!seat) return;

    seat.lastAction = action;
    seat.lastActionTime = Date.now();

    // Update fingerprint based on action
    if (seat.currentPlayerId) {
      const isVPIP = ['call', 'raise', 'bet', 'all-in'].includes(action.toLowerCase());
      const isPFR = ['raise', 'bet', '3-bet', '4-bet'].includes(action.toLowerCase());
      const isAggressive = ['raise', 'bet', 're-raise', 'all-in'].includes(action.toLowerCase());

      this.updatePlayerFingerprint(seat.currentPlayerId, {
        vpipAction: isVPIP,
        pfrAction: isPFR,
        aggressiveAction: isAggressive,
      });
    }
  }

  /**
   * Start a new hand - increment hand counter
   */
  newHand(): void {
    this.handNumber++;
    
    // Clear last actions
    for (const seat of this.seats.values()) {
      seat.lastAction = null;
      seat.lastActionTime = null;
    }
  }

  /**
   * Get the current state of all seats
   */
  getAllSeats(): SeatState[] {
    return Array.from(this.seats.values());
  }

  /**
   * Get a specific seat
   */
  getSeat(seatNumber: number): SeatState | undefined {
    return this.seats.get(seatNumber);
  }

  /**
   * Get player fingerprint
   */
  getPlayerFingerprint(playerId: string): PlayerFingerprint | undefined {
    return this.playerFingerprints.get(playerId);
  }

  /**
   * Get recent player changes
   */
  getRecentChanges(limit: number = 10): PlayerChange[] {
    return this.changeHistory.slice(-limit);
  }

  /**
   * Get occupied seat count
   */
  getOccupiedCount(): number {
    let count = 0;
    for (const seat of this.seats.values()) {
      if (seat.isOccupied && !seat.isSittingOut) count++;
    }
    return count;
  }

  /**
   * Export current state for debugging
   */
  exportState(): {
    seats: SeatState[];
    fingerprints: [string, PlayerFingerprint][];
    changes: PlayerChange[];
    handNumber: number;
  } {
    return {
      seats: this.getAllSeats(),
      fingerprints: Array.from(this.playerFingerprints.entries()),
      changes: this.changeHistory,
      handNumber: this.handNumber,
    };
  }
}

/**
 * Create a player tracker for a specific site
 */
export function createPlayerTracker(
  siteConfig: {
    name: string;
    maxSeats: number;
    isAnonymous?: boolean;
  },
  sessionId: string,
  userId: string
): PlayerTracker {
  return new PlayerTracker({
    maxSeats: siteConfig.maxSeats,
    isAnonymous: siteConfig.isAnonymous ?? false,
    sessionId,
    userId,
    rebuySuspicionThreshold: 0.5,
  });
}

export default PlayerTracker;
