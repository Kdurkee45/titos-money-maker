/**
 * Database types for Supabase tables
 * These types mirror the database schema and are used for type-safe queries
 */

// ============================================================================
// ENUMS
// ============================================================================

export type PokerSite = 'pokerstars' | 'ggpoker' | 'wsop' | 'acr' | 'partypoker' | 'other';
export type TableType = 'cash' | 'tournament' | 'sit-n-go';
export type Street = 'preflop' | 'flop' | 'turn' | 'river';
export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in' | 'post-blind' | 'post-ante';
export type HandResult = 'won' | 'lost' | 'folded' | 'split';
export type PersonaType = 'aggressive' | 'conservative' | 'bluffer' | 'tight' | 'loose' | 'shark' | 'fish' | 'unknown';
export type Position = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'MP' | 'MP+1' | 'HJ' | 'CO';

// ============================================================================
// CARD TYPES (for JSONB fields)
// ============================================================================

export interface CardJson {
  rank: 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
}

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  site_player_id: string;
  poker_site: string;
  first_seen_by: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerStats {
  id: string;
  player_id: string;
  total_hands: number;
  
  // Pre-flop stats (percentages 0-100)
  vpip: number;
  pfr: number;
  three_bet: number;
  fold_to_three_bet: number;
  four_bet: number;
  fold_to_four_bet: number;
  
  // Post-flop stats
  aggression_factor: number;
  cbet: number;
  fold_to_cbet: number;
  cbet_turn: number;
  cbet_river: number;
  
  // Showdown stats
  wtsd: number;
  wsd: number;
  wwsf: number;
  
  // Betting patterns
  avg_bet_size: number;
  avg_raise_size: number;
  
  // Raw counters
  hands_vpip: number;
  hands_pfr: number;
  hands_three_bet_opportunity: number;
  hands_three_bet: number;
  hands_fold_to_three_bet_opportunity: number;
  hands_fold_to_three_bet: number;
  hands_cbet_opportunity: number;
  hands_cbet: number;
  hands_fold_to_cbet_opportunity: number;
  hands_fold_to_cbet: number;
  hands_wtsd: number;
  hands_wsd: number;
  
  last_updated: string;
}

export interface Session {
  id: string;
  user_id: string;
  poker_site: string;
  table_name: string | null;
  table_type: TableType | null;
  stakes: string | null;
  small_blind: number | null;
  big_blind: number | null;
  max_players: number;
  started_at: string;
  ended_at: string | null;
  hands_played: number;
  profit_loss: number;
  created_at: string;
  updated_at: string;
}

export interface Hand {
  id: string;
  session_id: string;
  hand_number: number;
  played_at: string;
  hero_cards: CardJson[] | null;
  community_cards: CardJson[];
  pot_size: number;
  rake: number;
  result: HandResult | null;
  profit: number;
  went_to_showdown: boolean;
  hero_position: Position | null;
  winning_hand: string | null;
  players_involved: string[];
  created_at: string;
}

export interface HandAction {
  id: string;
  hand_id: string;
  player_id: string | null;
  street: Street;
  action: ActionType;
  amount: number | null;
  raise_to: number | null;
  pot_after: number | null;
  sequence: number;
  is_hero: boolean;
  created_at: string;
}

export interface PlayerObservation {
  id: string;
  user_id: string;
  player_id: string;
  persona: PersonaType | null;
  notes: string | null;
  color_label: string | null;
  persona_confidence: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface PrecomputedRange {
  id: string;
  situation_key: string;
  position: string;
  action_type: string;
  stack_depth_bb: number;
  range_data: Record<string, number>;
  description: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INSERT TYPES (for creating new records)
// ============================================================================

export interface UserInsert {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
}

export interface PlayerInsert {
  site_player_id: string;
  poker_site: string;
  display_name?: string | null;
}

export interface SessionInsert {
  poker_site: string;
  table_name?: string | null;
  table_type?: TableType | null;
  stakes?: string | null;
  small_blind?: number | null;
  big_blind?: number | null;
  max_players?: number;
}

export interface HandInsert {
  session_id: string;
  hand_number: number;
  played_at?: string;
  hero_cards?: CardJson[] | null;
  community_cards?: CardJson[];
  pot_size?: number;
  rake?: number;
  result?: HandResult | null;
  profit?: number;
  went_to_showdown?: boolean;
  hero_position?: Position | null;
  winning_hand?: string | null;
  players_involved?: string[];
}

export interface HandActionInsert {
  hand_id: string;
  player_id?: string | null;
  street: Street;
  action: ActionType;
  amount?: number | null;
  raise_to?: number | null;
  pot_after?: number | null;
  sequence: number;
  is_hero?: boolean;
}

export interface PlayerObservationInsert {
  player_id: string;
  persona?: PersonaType | null;
  notes?: string | null;
  color_label?: string | null;
  persona_confidence?: number;
  tags?: string[];
}

// ============================================================================
// UPDATE TYPES (for updating records)
// ============================================================================

export interface UserUpdate {
  username?: string | null;
  avatar_url?: string | null;
}

export interface SessionUpdate {
  table_name?: string | null;
  ended_at?: string | null;
  hands_played?: number;
  profit_loss?: number;
}

export interface HandUpdate {
  community_cards?: CardJson[];
  pot_size?: number;
  result?: HandResult | null;
  profit?: number;
  went_to_showdown?: boolean;
  winning_hand?: string | null;
}

export interface PlayerObservationUpdate {
  persona?: PersonaType | null;
  notes?: string | null;
  color_label?: string | null;
  persona_confidence?: number;
  tags?: string[];
}

// ============================================================================
// QUERY RESULT TYPES (for joins and views)
// ============================================================================

export interface PlayerWithStats extends Player {
  stats: PlayerStats | null;
  observation: PlayerObservation | null;
}

export interface HandWithActions extends Hand {
  actions: HandAction[];
}

export interface SessionWithHands extends Session {
  hands: Hand[];
}

export interface SessionSummary {
  total_hands: number;
  hands_won: number;
  hands_lost: number;
  total_profit: number;
  biggest_pot: number;
  showdowns: number;
}

// ============================================================================
// SUPABASE DATABASE TYPE (for client initialization)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      players: {
        Row: Player;
        Insert: PlayerInsert;
        Update: Partial<PlayerInsert>;
        Relationships: [];
      };
      player_stats: {
        Row: PlayerStats;
        Insert: { player_id: string };
        Update: Partial<PlayerStats>;
        Relationships: [];
      };
      sessions: {
        Row: Session;
        Insert: SessionInsert & { user_id: string };
        Update: SessionUpdate;
        Relationships: [];
      };
      hands: {
        Row: Hand;
        Insert: HandInsert;
        Update: HandUpdate;
        Relationships: [];
      };
      hand_actions: {
        Row: HandAction;
        Insert: HandActionInsert;
        Update: Partial<HandActionInsert>;
        Relationships: [];
      };
      player_observations: {
        Row: PlayerObservation;
        Insert: PlayerObservationInsert & { user_id?: string };
        Update: PlayerObservationUpdate;
        Relationships: [];
      };
      precomputed_ranges: {
        Row: PrecomputedRange;
        Insert: Omit<PrecomputedRange, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PrecomputedRange, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_or_create_player: {
        Args: { p_site_player_id: string; p_poker_site: string; p_display_name?: string };
        Returns: string;
      };
      get_player_with_stats: {
        Args: { p_player_id: string };
        Returns: PlayerWithStats[];
      };
      get_session_summary: {
        Args: { p_session_id: string };
        Returns: SessionSummary[];
      };
      search_players: {
        Args: { p_search_term: string; p_poker_site?: string; p_limit?: number };
        Returns: Array<Pick<Player, 'id' | 'site_player_id' | 'poker_site' | 'display_name'> & { total_hands: number }>;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
