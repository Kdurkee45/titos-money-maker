-- GTO Poker Pro - Initial Database Schema
-- This migration creates all core tables for the poker tracking application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE (extends Supabase Auth)
-- ============================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PLAYERS TABLE (shared opponent database)
-- ============================================================================
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_player_id TEXT NOT NULL,
  poker_site TEXT NOT NULL,
  first_seen_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(site_player_id, poker_site)
);

CREATE INDEX idx_players_site ON public.players(poker_site);
CREATE INDEX idx_players_site_player_id ON public.players(site_player_id);

-- ============================================================================
-- PLAYER_STATS TABLE (aggregated statistics per player)
-- ============================================================================
CREATE TABLE public.player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  
  -- Sample size
  total_hands INTEGER NOT NULL DEFAULT 0,
  
  -- Pre-flop stats (stored as percentages 0-100)
  vpip NUMERIC(5,2) DEFAULT 0,
  pfr NUMERIC(5,2) DEFAULT 0,
  three_bet NUMERIC(5,2) DEFAULT 0,
  fold_to_three_bet NUMERIC(5,2) DEFAULT 0,
  four_bet NUMERIC(5,2) DEFAULT 0,
  fold_to_four_bet NUMERIC(5,2) DEFAULT 0,
  
  -- Post-flop stats
  aggression_factor NUMERIC(5,2) DEFAULT 0,
  cbet NUMERIC(5,2) DEFAULT 0,
  fold_to_cbet NUMERIC(5,2) DEFAULT 0,
  cbet_turn NUMERIC(5,2) DEFAULT 0,
  cbet_river NUMERIC(5,2) DEFAULT 0,
  
  -- Showdown stats
  wtsd NUMERIC(5,2) DEFAULT 0,
  wsd NUMERIC(5,2) DEFAULT 0,
  wwsf NUMERIC(5,2) DEFAULT 0,
  
  -- Betting patterns
  avg_bet_size NUMERIC(6,2) DEFAULT 0,
  avg_raise_size NUMERIC(5,2) DEFAULT 0,
  
  -- Raw counters for calculating percentages
  hands_vpip INTEGER DEFAULT 0,
  hands_pfr INTEGER DEFAULT 0,
  hands_three_bet_opportunity INTEGER DEFAULT 0,
  hands_three_bet INTEGER DEFAULT 0,
  hands_fold_to_three_bet_opportunity INTEGER DEFAULT 0,
  hands_fold_to_three_bet INTEGER DEFAULT 0,
  hands_cbet_opportunity INTEGER DEFAULT 0,
  hands_cbet INTEGER DEFAULT 0,
  hands_fold_to_cbet_opportunity INTEGER DEFAULT 0,
  hands_fold_to_cbet INTEGER DEFAULT 0,
  hands_wtsd INTEGER DEFAULT 0,
  hands_wsd INTEGER DEFAULT 0,
  
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(player_id)
);

CREATE INDEX idx_player_stats_player_id ON public.player_stats(player_id);

-- ============================================================================
-- SESSIONS TABLE (poker sessions)
-- ============================================================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  poker_site TEXT NOT NULL,
  table_name TEXT,
  table_type TEXT, -- 'cash', 'tournament', 'sit-n-go'
  stakes TEXT,
  small_blind NUMERIC(10,2),
  big_blind NUMERIC(10,2),
  max_players INTEGER DEFAULT 9,
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Session summary
  hands_played INTEGER DEFAULT 0,
  profit_loss NUMERIC(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_started_at ON public.sessions(started_at DESC);

-- ============================================================================
-- HANDS TABLE (individual hand histories)
-- ============================================================================
CREATE TABLE public.hands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  hand_number BIGINT NOT NULL,
  
  -- Timing
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Cards (stored as JSONB arrays)
  hero_cards JSONB, -- [{"rank": "A", "suit": "spades"}, {"rank": "K", "suit": "spades"}]
  community_cards JSONB DEFAULT '[]'::jsonb,
  
  -- Pot and result
  pot_size NUMERIC(12,2) NOT NULL DEFAULT 0,
  rake NUMERIC(10,2) DEFAULT 0,
  result TEXT CHECK (result IN ('won', 'lost', 'folded', 'split')),
  profit NUMERIC(12,2) DEFAULT 0,
  
  -- Hand details
  went_to_showdown BOOLEAN DEFAULT FALSE,
  hero_position TEXT,
  winning_hand TEXT, -- Description like "Full House, Kings over Sevens"
  
  -- Players involved (array of player IDs)
  players_involved JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hands_session_id ON public.hands(session_id);
CREATE INDEX idx_hands_played_at ON public.hands(played_at DESC);
CREATE INDEX idx_hands_hand_number ON public.hands(session_id, hand_number);

-- ============================================================================
-- HAND_ACTIONS TABLE (actions within a hand)
-- ============================================================================
CREATE TABLE public.hand_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hand_id UUID NOT NULL REFERENCES public.hands(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  
  street TEXT NOT NULL CHECK (street IN ('preflop', 'flop', 'turn', 'river')),
  action TEXT NOT NULL CHECK (action IN ('fold', 'check', 'call', 'bet', 'raise', 'all-in', 'post-blind', 'post-ante')),
  amount NUMERIC(12,2),
  
  -- For raises, track the raise-to amount
  raise_to NUMERIC(12,2),
  
  -- Pot size after this action
  pot_after NUMERIC(12,2),
  
  -- Sequence within the hand (1, 2, 3, ...)
  sequence INTEGER NOT NULL,
  
  -- Is this the hero's action?
  is_hero BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hand_actions_hand_id ON public.hand_actions(hand_id);
CREATE INDEX idx_hand_actions_player_id ON public.hand_actions(player_id);
CREATE INDEX idx_hand_actions_sequence ON public.hand_actions(hand_id, sequence);

-- ============================================================================
-- PLAYER_OBSERVATIONS TABLE (per-user notes on opponents)
-- ============================================================================
CREATE TABLE public.player_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  
  persona TEXT CHECK (persona IN ('aggressive', 'conservative', 'bluffer', 'tight', 'loose', 'shark', 'fish', 'unknown')),
  notes TEXT,
  color_label TEXT, -- Hex color code
  
  -- Confidence in persona assessment (0-100)
  persona_confidence INTEGER DEFAULT 0 CHECK (persona_confidence >= 0 AND persona_confidence <= 100),
  
  -- Tags for quick filtering
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, player_id)
);

CREATE INDEX idx_player_observations_user_id ON public.player_observations(user_id);
CREATE INDEX idx_player_observations_player_id ON public.player_observations(player_id);

-- ============================================================================
-- PRECOMPUTED_RANGES TABLE (for GTO solver)
-- ============================================================================
CREATE TABLE public.precomputed_ranges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Situation identifier
  situation_key TEXT NOT NULL UNIQUE, -- e.g., "UTG_open_100bb"
  
  -- Position and context
  position TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'open', 'vs_raise', 'vs_3bet', etc.
  stack_depth_bb INTEGER NOT NULL,
  
  -- The range data (hand -> frequency)
  range_data JSONB NOT NULL, -- {"AA": 1.0, "AKs": 1.0, "AKo": 0.8, ...}
  
  -- Metadata
  description TEXT,
  source TEXT, -- 'piosolver', 'gto+', 'custom', etc.
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_precomputed_ranges_situation ON public.precomputed_ranges(situation_key);
CREATE INDEX idx_precomputed_ranges_position ON public.precomputed_ranges(position);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_observations_updated_at
  BEFORE UPDATE ON public.player_observations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_precomputed_ranges_updated_at
  BEFORE UPDATE ON public.precomputed_ranges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
