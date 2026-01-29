-- GTO Poker Pro - Row Level Security Policies
-- This migration enables RLS and creates access policies for all tables

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hand_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precomputed_ranges ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PLAYERS TABLE POLICIES (Shared opponent database)
-- ============================================================================
-- All authenticated users can read players
CREATE POLICY "Authenticated users can view all players"
  ON public.players FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert new players
CREATE POLICY "Authenticated users can create players"
  ON public.players FOR INSERT
  TO authenticated
  WITH CHECK (first_seen_by = auth.uid());

-- Only the user who first saw the player can update basic info
-- (stats are updated via aggregation, not direct updates)
CREATE POLICY "First observer can update player"
  ON public.players FOR UPDATE
  TO authenticated
  USING (first_seen_by = auth.uid())
  WITH CHECK (first_seen_by = auth.uid());

-- ============================================================================
-- PLAYER_STATS TABLE POLICIES (Shared stats)
-- ============================================================================
-- All authenticated users can read player stats
CREATE POLICY "Authenticated users can view all player stats"
  ON public.player_stats FOR SELECT
  TO authenticated
  USING (true);

-- Stats are created when a player is created
CREATE POLICY "Authenticated users can create player stats"
  ON public.player_stats FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = player_id
      AND players.first_seen_by = auth.uid()
    )
  );

-- Stats can be updated by anyone (aggregated from all users' hands)
-- In production, this would be done via a service role or edge function
CREATE POLICY "Authenticated users can update player stats"
  ON public.player_stats FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SESSIONS TABLE POLICIES (User's own sessions)
-- ============================================================================
-- Users can only view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON public.sessions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- HANDS TABLE POLICIES (User's own hands via sessions)
-- ============================================================================
-- Users can view hands from their own sessions
CREATE POLICY "Users can view own hands"
  ON public.hands FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = hands.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Users can create hands in their own sessions
CREATE POLICY "Users can create hands in own sessions"
  ON public.hands FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Users can update hands in their own sessions
CREATE POLICY "Users can update own hands"
  ON public.hands FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = hands.session_id
      AND sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Users can delete hands in their own sessions
CREATE POLICY "Users can delete own hands"
  ON public.hands FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = hands.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- HAND_ACTIONS TABLE POLICIES
-- ============================================================================
-- Users can view actions from their own hands
CREATE POLICY "Users can view own hand actions"
  ON public.hand_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hands
      JOIN public.sessions ON sessions.id = hands.session_id
      WHERE hands.id = hand_actions.hand_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Users can create actions in their own hands
CREATE POLICY "Users can create actions in own hands"
  ON public.hand_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hands
      JOIN public.sessions ON sessions.id = hands.session_id
      WHERE hands.id = hand_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Users can update actions in their own hands
CREATE POLICY "Users can update own hand actions"
  ON public.hand_actions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.hands
      JOIN public.sessions ON sessions.id = hands.session_id
      WHERE hands.id = hand_actions.hand_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Users can delete actions in their own hands
CREATE POLICY "Users can delete own hand actions"
  ON public.hand_actions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.hands
      JOIN public.sessions ON sessions.id = hands.session_id
      WHERE hands.id = hand_actions.hand_id
      AND sessions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PLAYER_OBSERVATIONS TABLE POLICIES (User's private notes)
-- ============================================================================
-- Users can only view their own observations
CREATE POLICY "Users can view own observations"
  ON public.player_observations FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own observations
CREATE POLICY "Users can create own observations"
  ON public.player_observations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own observations
CREATE POLICY "Users can update own observations"
  ON public.player_observations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own observations
CREATE POLICY "Users can delete own observations"
  ON public.player_observations FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- PRECOMPUTED_RANGES TABLE POLICIES (Read-only for users)
-- ============================================================================
-- All authenticated users can read precomputed ranges
CREATE POLICY "Authenticated users can view precomputed ranges"
  ON public.precomputed_ranges FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update/delete (managed by admin)
-- No INSERT/UPDATE/DELETE policies for regular users

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
