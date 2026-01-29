-- GTO Poker Pro - Helper Functions
-- Database functions for common operations

-- ============================================================================
-- FUNCTION: Get or create a player
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_or_create_player(
  p_site_player_id TEXT,
  p_poker_site TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_player_id UUID;
BEGIN
  -- Try to find existing player
  SELECT id INTO v_player_id
  FROM public.players
  WHERE site_player_id = p_site_player_id
    AND poker_site = p_poker_site;
  
  -- If not found, create new player
  IF v_player_id IS NULL THEN
    INSERT INTO public.players (site_player_id, poker_site, first_seen_by, display_name)
    VALUES (p_site_player_id, p_poker_site, auth.uid(), COALESCE(p_display_name, p_site_player_id))
    RETURNING id INTO v_player_id;
    
    -- Also create empty stats record
    INSERT INTO public.player_stats (player_id)
    VALUES (v_player_id);
  END IF;
  
  RETURN v_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Record a hand action and update player stats
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_hand_action(
  p_hand_id UUID,
  p_player_id UUID,
  p_street TEXT,
  p_action TEXT,
  p_amount NUMERIC,
  p_sequence INTEGER,
  p_is_hero BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
BEGIN
  -- Insert the action
  INSERT INTO public.hand_actions (hand_id, player_id, street, action, amount, sequence, is_hero)
  VALUES (p_hand_id, p_player_id, p_street, p_action, p_amount, p_sequence, p_is_hero)
  RETURNING id INTO v_action_id;
  
  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Update player stats after a hand
-- This is a simplified version - a full implementation would track all scenarios
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_player_stats_from_hand(
  p_player_id UUID,
  p_hand_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_stats RECORD;
  v_actions RECORD;
  v_vpip_action BOOLEAN := FALSE;
  v_pfr_action BOOLEAN := FALSE;
  v_cbet_opportunity BOOLEAN := FALSE;
  v_cbet_action BOOLEAN := FALSE;
BEGIN
  -- Get all actions for this player in this hand
  FOR v_actions IN
    SELECT street, action, amount, sequence
    FROM public.hand_actions
    WHERE hand_id = p_hand_id AND player_id = p_player_id
    ORDER BY sequence
  LOOP
    -- Check for VPIP (voluntarily put money in pot preflop)
    IF v_actions.street = 'preflop' AND v_actions.action IN ('call', 'bet', 'raise', 'all-in') THEN
      v_vpip_action := TRUE;
    END IF;
    
    -- Check for PFR (preflop raise)
    IF v_actions.street = 'preflop' AND v_actions.action IN ('bet', 'raise', 'all-in') THEN
      v_pfr_action := TRUE;
    END IF;
  END LOOP;
  
  -- Update the stats
  UPDATE public.player_stats
  SET
    total_hands = total_hands + 1,
    hands_vpip = hands_vpip + CASE WHEN v_vpip_action THEN 1 ELSE 0 END,
    hands_pfr = hands_pfr + CASE WHEN v_pfr_action THEN 1 ELSE 0 END,
    vpip = CASE WHEN total_hands + 1 > 0 
           THEN ((hands_vpip + CASE WHEN v_vpip_action THEN 1 ELSE 0 END)::NUMERIC / (total_hands + 1)) * 100 
           ELSE 0 END,
    pfr = CASE WHEN total_hands + 1 > 0 
          THEN ((hands_pfr + CASE WHEN v_pfr_action THEN 1 ELSE 0 END)::NUMERIC / (total_hands + 1)) * 100 
          ELSE 0 END,
    last_updated = NOW()
  WHERE player_id = p_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get player stats with observation for current user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_player_with_stats(p_player_id UUID)
RETURNS TABLE (
  id UUID,
  site_player_id TEXT,
  poker_site TEXT,
  display_name TEXT,
  total_hands INTEGER,
  vpip NUMERIC,
  pfr NUMERIC,
  three_bet NUMERIC,
  aggression_factor NUMERIC,
  cbet NUMERIC,
  wtsd NUMERIC,
  wsd NUMERIC,
  persona TEXT,
  notes TEXT,
  color_label TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.site_player_id,
    p.poker_site,
    p.display_name,
    ps.total_hands,
    ps.vpip,
    ps.pfr,
    ps.three_bet,
    ps.aggression_factor,
    ps.cbet,
    ps.wtsd,
    ps.wsd,
    po.persona,
    po.notes,
    po.color_label
  FROM public.players p
  LEFT JOIN public.player_stats ps ON ps.player_id = p.id
  LEFT JOIN public.player_observations po ON po.player_id = p.id AND po.user_id = auth.uid()
  WHERE p.id = p_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get session summary
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_session_summary(p_session_id UUID)
RETURNS TABLE (
  total_hands BIGINT,
  hands_won BIGINT,
  hands_lost BIGINT,
  total_profit NUMERIC,
  biggest_pot NUMERIC,
  showdowns INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_hands,
    COUNT(*) FILTER (WHERE result = 'won')::BIGINT as hands_won,
    COUNT(*) FILTER (WHERE result = 'lost')::BIGINT as hands_lost,
    COALESCE(SUM(profit), 0) as total_profit,
    COALESCE(MAX(pot_size), 0) as biggest_pot,
    COUNT(*) FILTER (WHERE went_to_showdown)::INTEGER as showdowns
  FROM public.hands
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Search players by name
-- ============================================================================
CREATE OR REPLACE FUNCTION public.search_players(
  p_search_term TEXT,
  p_poker_site TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  site_player_id TEXT,
  poker_site TEXT,
  display_name TEXT,
  total_hands INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.site_player_id,
    p.poker_site,
    p.display_name,
    COALESCE(ps.total_hands, 0) as total_hands
  FROM public.players p
  LEFT JOIN public.player_stats ps ON ps.player_id = p.id
  WHERE 
    (p.site_player_id ILIKE '%' || p_search_term || '%' 
     OR p.display_name ILIKE '%' || p_search_term || '%')
    AND (p_poker_site IS NULL OR p.poker_site = p_poker_site)
  ORDER BY ps.total_hands DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
