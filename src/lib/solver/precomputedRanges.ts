/**
 * Pre-computed Ranges
 * GTO-approximate ranges for common poker situations
 * Based on standard poker theory and solver outputs
 */

import { Position } from '@/lib/poker/types';

// Range represented as hand -> frequency (0-1)
export type RangeData = Record<string, number>;

// Pre-computed range entry
export interface PrecomputedRange {
  situationKey: string;
  position: Position | string;
  actionType: string;
  stackDepthBB: number;
  range: RangeData;
  description: string;
}

// ============================================================================
// OPENING RANGES (RFI - Raise First In)
// ============================================================================

/**
 * UTG opening range (~12% of hands)
 * Very tight, only premium hands
 */
export const UTG_OPEN_100BB: RangeData = {
  // Pairs
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 0.5, '77': 0.25,
  
  // Suited broadway
  'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 0.75,
  'KQs': 1, 'KJs': 0.5, 'KTs': 0.25,
  'QJs': 0.5, 'QTs': 0.25,
  'JTs': 0.25,
  
  // Offsuit broadway
  'AKo': 1, 'AQo': 0.75, 'AJo': 0.25,
  'KQo': 0.25,
};

/**
 * MP opening range (~15% of hands)
 */
export const MP_OPEN_100BB: RangeData = {
  // Pairs
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 1, '77': 0.5, '66': 0.25,
  
  // Suited broadway
  'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 0.25,
  'KQs': 1, 'KJs': 1, 'KTs': 0.5,
  'QJs': 1, 'QTs': 0.5,
  'JTs': 0.75,
  
  // Suited connectors
  'T9s': 0.25, '98s': 0.25,
  
  // Offsuit broadway
  'AKo': 1, 'AQo': 1, 'AJo': 0.5, 'ATo': 0.25,
  'KQo': 0.75, 'KJo': 0.25,
};

/**
 * CO opening range (~25% of hands)
 */
export const CO_OPEN_100BB: RangeData = {
  // Pairs
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 1, '77': 1, '66': 1, '55': 0.5, '44': 0.25, '33': 0.25, '22': 0.25,
  
  // Suited aces
  'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 1, 'A8s': 0.75, 'A7s': 0.5, 'A6s': 0.5, 'A5s': 1, 'A4s': 0.75, 'A3s': 0.5, 'A2s': 0.5,
  
  // Suited broadway
  'KQs': 1, 'KJs': 1, 'KTs': 1, 'K9s': 0.5,
  'QJs': 1, 'QTs': 1, 'Q9s': 0.5,
  'JTs': 1, 'J9s': 0.5,
  'T9s': 1,
  
  // Suited connectors
  '98s': 1, '87s': 0.75, '76s': 0.5, '65s': 0.5, '54s': 0.5,
  
  // Offsuit broadway
  'AKo': 1, 'AQo': 1, 'AJo': 1, 'ATo': 0.75, 'A9o': 0.25,
  'KQo': 1, 'KJo': 0.75, 'KTo': 0.5,
  'QJo': 0.75, 'QTo': 0.25,
  'JTo': 0.5,
};

/**
 * BTN opening range (~45% of hands)
 */
export const BTN_OPEN_100BB: RangeData = {
  // All pairs
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 1, '77': 1, '66': 1, '55': 1, '44': 1, '33': 1, '22': 1,
  
  // All suited aces
  'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 1, 'A8s': 1, 'A7s': 1, 'A6s': 1, 'A5s': 1, 'A4s': 1, 'A3s': 1, 'A2s': 1,
  
  // Suited kings
  'KQs': 1, 'KJs': 1, 'KTs': 1, 'K9s': 1, 'K8s': 0.75, 'K7s': 0.5, 'K6s': 0.5, 'K5s': 0.5, 'K4s': 0.25,
  
  // Suited queens
  'QJs': 1, 'QTs': 1, 'Q9s': 1, 'Q8s': 0.75, 'Q7s': 0.5, 'Q6s': 0.25,
  
  // Suited jacks
  'JTs': 1, 'J9s': 1, 'J8s': 0.75, 'J7s': 0.5,
  
  // Suited connectors
  'T9s': 1, 'T8s': 0.75, '98s': 1, '97s': 0.5, '87s': 1, '86s': 0.5, '76s': 1, '75s': 0.5, '65s': 1, '64s': 0.25, '54s': 1, '53s': 0.25, '43s': 0.5,
  
  // Offsuit broadway
  'AKo': 1, 'AQo': 1, 'AJo': 1, 'ATo': 1, 'A9o': 0.75, 'A8o': 0.5, 'A7o': 0.5, 'A6o': 0.25, 'A5o': 0.5, 'A4o': 0.25, 'A3o': 0.25, 'A2o': 0.25,
  'KQo': 1, 'KJo': 1, 'KTo': 1, 'K9o': 0.5, 'K8o': 0.25,
  'QJo': 1, 'QTo': 0.75, 'Q9o': 0.25,
  'JTo': 1, 'J9o': 0.5,
  'T9o': 0.5,
};

/**
 * SB opening range (vs BB) (~40% of hands)
 */
export const SB_OPEN_100BB: RangeData = {
  // All pairs
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 1, '77': 1, '66': 1, '55': 1, '44': 1, '33': 1, '22': 1,
  
  // All suited aces
  'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 1, 'A8s': 1, 'A7s': 1, 'A6s': 1, 'A5s': 1, 'A4s': 1, 'A3s': 1, 'A2s': 1,
  
  // Suited kings
  'KQs': 1, 'KJs': 1, 'KTs': 1, 'K9s': 1, 'K8s': 0.5, 'K7s': 0.5, 'K6s': 0.5, 'K5s': 0.5, 'K4s': 0.25, 'K3s': 0.25, 'K2s': 0.25,
  
  // Suited queens
  'QJs': 1, 'QTs': 1, 'Q9s': 1, 'Q8s': 0.5, 'Q7s': 0.25, 'Q6s': 0.25,
  
  // Suited connectors
  'JTs': 1, 'J9s': 1, 'T9s': 1, '98s': 1, '87s': 1, '76s': 1, '65s': 1, '54s': 1,
  
  // Offsuit broadway
  'AKo': 1, 'AQo': 1, 'AJo': 1, 'ATo': 1, 'A9o': 0.75, 'A8o': 0.5, 'A7o': 0.5, 'A6o': 0.25, 'A5o': 0.5, 'A4o': 0.25,
  'KQo': 1, 'KJo': 1, 'KTo': 0.75, 'K9o': 0.25,
  'QJo': 1, 'QTo': 0.5,
  'JTo': 0.75,
};

// ============================================================================
// 3-BET RANGES
// ============================================================================

/**
 * 3-bet range vs UTG open (from BTN)
 */
export const BTN_3BET_VS_UTG: RangeData = {
  // Value
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 0.5, 'AKs': 1, 'AKo': 1,
  
  // Bluffs (blockers)
  'A5s': 0.5, 'A4s': 0.5, 'A3s': 0.25,
  'KQs': 0.25, 'AQs': 0.5,
};

/**
 * 3-bet range vs CO open (from BTN)
 */
export const BTN_3BET_VS_CO: RangeData = {
  // Value
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 0.5,
  'AKs': 1, 'AKo': 1, 'AQs': 1, 'AQo': 0.5,
  
  // Bluffs
  'A5s': 1, 'A4s': 0.75, 'A3s': 0.5, 'A2s': 0.25,
  'K5s': 0.25, 'K4s': 0.25,
  '76s': 0.25, '65s': 0.25, '54s': 0.25,
};

/**
 * BB 3-bet range vs BTN open
 */
export const BB_3BET_VS_BTN: RangeData = {
  // Value
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 0.75, '99': 0.25,
  'AKs': 1, 'AKo': 1, 'AQs': 1, 'AQo': 0.75, 'AJs': 0.5,
  'KQs': 0.5,
  
  // Bluffs
  'A5s': 1, 'A4s': 1, 'A3s': 0.75, 'A2s': 0.5,
  'K9s': 0.25, 'K8s': 0.25,
  'Q9s': 0.25, 'J9s': 0.25, 'T9s': 0.25,
  '87s': 0.25, '76s': 0.25, '65s': 0.25, '54s': 0.25,
};

// ============================================================================
// CALLING RANGES
// ============================================================================

/**
 * BB defend vs BTN open
 */
export const BB_CALL_VS_BTN: RangeData = {
  // Pairs
  '99': 0.75, '88': 1, '77': 1, '66': 1, '55': 1, '44': 1, '33': 1, '22': 1,
  
  // Suited aces
  'A9s': 1, 'A8s': 1, 'A7s': 1, 'A6s': 1, 'A5s': 0.5, 'A4s': 0.5, 'A3s': 0.5, 'A2s': 0.5,
  
  // Suited kings
  'KJs': 1, 'KTs': 1, 'K9s': 1, 'K8s': 1, 'K7s': 0.75, 'K6s': 0.5, 'K5s': 0.5, 'K4s': 0.25,
  
  // Suited queens
  'QTs': 1, 'Q9s': 1, 'Q8s': 0.75, 'Q7s': 0.5, 'Q6s': 0.25,
  
  // Connectors
  'JTs': 1, 'J9s': 1, 'J8s': 0.5,
  'T9s': 1, 'T8s': 0.75,
  '98s': 1, '97s': 0.5,
  '87s': 1, '86s': 0.5,
  '76s': 1, '75s': 0.25,
  '65s': 1, '54s': 1, '43s': 0.5,
  
  // Offsuit
  'ATo': 1, 'A9o': 0.75, 'A8o': 0.5, 'A7o': 0.25, 'A6o': 0.25, 'A5o': 0.25,
  'KTo': 0.75, 'K9o': 0.5,
  'QJo': 0.5, 'QTo': 0.25,
  'JTo': 0.5, 'J9o': 0.25,
  'T9o': 0.25,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * All precomputed ranges
 */
export const PRECOMPUTED_RANGES: PrecomputedRange[] = [
  // Opening ranges
  {
    situationKey: 'UTG_open_100bb',
    position: 'UTG',
    actionType: 'open',
    stackDepthBB: 100,
    range: UTG_OPEN_100BB,
    description: 'UTG opening range at 100bb',
  },
  {
    situationKey: 'MP_open_100bb',
    position: 'MP',
    actionType: 'open',
    stackDepthBB: 100,
    range: MP_OPEN_100BB,
    description: 'MP opening range at 100bb',
  },
  {
    situationKey: 'CO_open_100bb',
    position: 'CO',
    actionType: 'open',
    stackDepthBB: 100,
    range: CO_OPEN_100BB,
    description: 'CO opening range at 100bb',
  },
  {
    situationKey: 'BTN_open_100bb',
    position: 'BTN',
    actionType: 'open',
    stackDepthBB: 100,
    range: BTN_OPEN_100BB,
    description: 'BTN opening range at 100bb',
  },
  {
    situationKey: 'SB_open_100bb',
    position: 'SB',
    actionType: 'open',
    stackDepthBB: 100,
    range: SB_OPEN_100BB,
    description: 'SB opening range at 100bb',
  },
  
  // 3-bet ranges
  {
    situationKey: 'BTN_3bet_vs_UTG',
    position: 'BTN',
    actionType: '3bet_vs_UTG',
    stackDepthBB: 100,
    range: BTN_3BET_VS_UTG,
    description: 'BTN 3-bet range vs UTG open',
  },
  {
    situationKey: 'BTN_3bet_vs_CO',
    position: 'BTN',
    actionType: '3bet_vs_CO',
    stackDepthBB: 100,
    range: BTN_3BET_VS_CO,
    description: 'BTN 3-bet range vs CO open',
  },
  {
    situationKey: 'BB_3bet_vs_BTN',
    position: 'BB',
    actionType: '3bet_vs_BTN',
    stackDepthBB: 100,
    range: BB_3BET_VS_BTN,
    description: 'BB 3-bet range vs BTN open',
  },
  
  // Calling ranges
  {
    situationKey: 'BB_call_vs_BTN',
    position: 'BB',
    actionType: 'call_vs_BTN',
    stackDepthBB: 100,
    range: BB_CALL_VS_BTN,
    description: 'BB calling range vs BTN open',
  },
];

/**
 * Get range by situation key
 */
export function getRange(situationKey: string): RangeData | null {
  const found = PRECOMPUTED_RANGES.find(r => r.situationKey === situationKey);
  return found?.range || null;
}

/**
 * Get opening range for a position
 */
export function getOpeningRange(position: Position | string, stackBB: number = 100): RangeData | null {
  const key = `${position}_open_${stackBB}bb`;
  return getRange(key);
}

/**
 * Get 3-bet range
 */
export function get3BetRange(position: Position | string, vsPosition: Position | string): RangeData | null {
  const key = `${position}_3bet_vs_${vsPosition}`;
  return getRange(key);
}

/**
 * Calculate range percentage (how many hands)
 */
export function getRangePercentage(range: RangeData): number {
  let totalCombos = 0;
  
  for (const [hand, weight] of Object.entries(range)) {
    if (weight === 0) continue;
    
    const isPair = hand[0] === hand[1];
    const isSuited = hand.includes('s');
    
    let combos: number;
    if (isPair) {
      combos = 6; // 6 combos for pairs
    } else if (isSuited) {
      combos = 4; // 4 combos for suited hands
    } else {
      combos = 12; // 12 combos for offsuit hands
    }
    
    totalCombos += combos * weight;
  }
  
  // Total possible combos is 1326
  return (totalCombos / 1326) * 100;
}

/**
 * Check if a hand is in a range
 */
export function isHandInRange(hand: string, range: RangeData): { inRange: boolean; frequency: number } {
  // Normalize hand notation
  const normalized = normalizeHand(hand);
  
  const frequency = range[normalized] || 0;
  return {
    inRange: frequency > 0,
    frequency,
  };
}

/**
 * Normalize hand notation (e.g., "KsAs" -> "AKs", "Ah Kd" -> "AKo")
 */
function normalizeHand(hand: string): string {
  // Remove spaces and extract cards
  const cleaned = hand.replace(/\s+/g, '');
  
  if (cleaned.length === 4) {
    // Format: "AsKs" or "AhKd"
    const rank1 = cleaned[0].toUpperCase();
    const suit1 = cleaned[1].toLowerCase();
    const rank2 = cleaned[2].toUpperCase();
    const suit2 = cleaned[3].toLowerCase();
    
    // Order ranks (higher first)
    const rankOrder = 'AKQJT98765432';
    const [highRank, lowRank] = rankOrder.indexOf(rank1) <= rankOrder.indexOf(rank2) 
      ? [rank1, rank2] 
      : [rank2, rank1];
    
    if (highRank === lowRank) {
      return `${highRank}${lowRank}`;
    }
    
    const suited = suit1 === suit2;
    return `${highRank}${lowRank}${suited ? 's' : 'o'}`;
  }
  
  // Already in correct format
  return cleaned;
}
