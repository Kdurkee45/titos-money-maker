/**
 * Board Texture and Draw Analyzer
 * Analyzes community cards for texture, draws, and danger cards
 */

import { Card, Rank, Suit, RANKS, SUITS, RANK_VALUES, BoardTexture, DrawInfo } from './types';
import { getRankValue, isSameCard } from './equityCalculator';

// ============================================================================
// BOARD TEXTURE ANALYSIS
// ============================================================================

/**
 * Count cards by suit
 */
function getSuitCounts(cards: Card[]): Map<Suit, number> {
  const counts = new Map<Suit, number>();
  for (const card of cards) {
    counts.set(card.suit, (counts.get(card.suit) || 0) + 1);
  }
  return counts;
}

/**
 * Count cards by rank
 */
function getRankCounts(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  }
  return counts;
}

/**
 * Check if ranks form a connected sequence (potential straight)
 */
function getConnectedness(cards: Card[]): { connected: boolean; gaps: number } {
  const ranks = [...new Set(cards.map(c => c.rank))];
  if (ranks.length < 2) return { connected: false, gaps: 0 };
  
  const values = ranks.map(r => getRankValue(r)).sort((a, b) => a - b);
  
  let totalGaps = 0;
  for (let i = 1; i < values.length; i++) {
    const gap = values[i] - values[i - 1] - 1;
    totalGaps += gap;
  }
  
  // Consider ace-low for wheel potential
  if (ranks.includes('A') && ranks.some(r => ['2', '3', '4', '5'].includes(r))) {
    totalGaps = Math.min(totalGaps, values.length - 1);
  }
  
  return {
    connected: totalGaps <= 2,
    gaps: totalGaps,
  };
}

/**
 * Check for straight draw possibilities on the board
 */
function hasStraightDraw(cards: Card[]): { hasOESD: boolean; hasGutshot: boolean } {
  const values = [...new Set(cards.map(c => getRankValue(c.rank)))].sort((a, b) => a - b);
  
  // Check for OESD (4 consecutive cards or close)
  let maxConsecutive = 1;
  let currentConsecutive = 1;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] - values[i - 1] === 1) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else if (values[i] - values[i - 1] > 2) {
      currentConsecutive = 1;
    }
  }
  
  const hasOESD = maxConsecutive >= 3;
  const hasGutshot = maxConsecutive >= 2 || (values.length >= 3 && values[values.length - 1] - values[0] <= 4);
  
  return { hasOESD, hasGutshot };
}

/**
 * Analyze board texture
 */
export function analyzeBoardTexture(communityCards: Card[]): BoardTexture {
  if (communityCards.length === 0) {
    return {
      isPaired: false,
      pairRank: null,
      isTrips: false,
      isMonotone: false,
      isTwoTone: false,
      isRainbow: false,
      flushSuit: null,
      flushDrawSuit: null,
      isConnected: false,
      hasGutshot: false,
      hasOESD: false,
      highCard: 'A',
      texture: 'dry',
      dangerLevel: 'low',
    };
  }
  
  const suitCounts = getSuitCounts(communityCards);
  const rankCounts = getRankCounts(communityCards);
  
  // Pairing
  const pairRanks = [...rankCounts.entries()].filter(([, count]) => count >= 2);
  const isPaired = pairRanks.length > 0;
  const pairRank = isPaired ? pairRanks[0][0] : null;
  const isTrips = pairRanks.some(([, count]) => count >= 3);
  
  // Suits
  const suitEntries = [...suitCounts.entries()];
  const maxSuitCount = Math.max(...suitEntries.map(([, c]) => c));
  const isMonotone = maxSuitCount >= 3 && communityCards.length === 3;
  const isTwoTone = maxSuitCount === 2 && suitEntries.filter(([, c]) => c >= 2).length >= 1;
  const isRainbow = maxSuitCount === 1 || (communityCards.length === 3 && suitEntries.length === 3);
  
  // Flush possibilities
  const flushSuit = suitEntries.find(([, c]) => c >= 3)?.[0] || null;
  const flushDrawSuit = !flushSuit ? suitEntries.find(([, c]) => c === 2)?.[0] || null : null;
  
  // Connectedness
  const { connected: isConnected, gaps } = getConnectedness(communityCards);
  const { hasOESD, hasGutshot } = hasStraightDraw(communityCards);
  
  // High card
  const highCard = [...communityCards].sort((a, b) => 
    getRankValue(b.rank) - getRankValue(a.rank)
  )[0].rank;
  
  // Texture classification
  let texture: 'dry' | 'semi-wet' | 'wet';
  let dangerLevel: 'low' | 'medium' | 'high';
  
  const wetFactors = [
    isMonotone,
    isTwoTone && hasOESD,
    isConnected && gaps <= 1,
    isPaired && (isTwoTone || hasOESD),
  ].filter(Boolean).length;
  
  if (wetFactors >= 2 || isMonotone) {
    texture = 'wet';
    dangerLevel = 'high';
  } else if (wetFactors === 1 || (isTwoTone && !isPaired)) {
    texture = 'semi-wet';
    dangerLevel = 'medium';
  } else {
    texture = 'dry';
    dangerLevel = isPaired ? 'medium' : 'low';
  }
  
  return {
    isPaired,
    pairRank,
    isTrips,
    isMonotone,
    isTwoTone,
    isRainbow,
    flushSuit,
    flushDrawSuit,
    isConnected,
    hasGutshot,
    hasOESD,
    highCard,
    texture,
    dangerLevel,
  };
}

// ============================================================================
// DRAW ANALYSIS
// ============================================================================

/**
 * Find all draws available to a hand
 */
export function findDraws(
  holeCards: Card[],
  communityCards: Card[]
): DrawInfo[] {
  const draws: DrawInfo[] = [];
  const allCards = [...holeCards, ...communityCards];
  const cardsRemaining = communityCards.length === 3 ? 2 : communityCards.length === 4 ? 1 : 0;
  
  if (cardsRemaining === 0) return draws;
  
  // Check for flush draw
  const suitCounts = getSuitCounts(allCards);
  for (const [suit, count] of suitCounts) {
    if (count === 4) {
      // Flush draw
      const outs = 13 - count; // 9 outs
      const probability = cardsRemaining === 2 
        ? (1 - ((47 - outs) / 47) * ((46 - outs) / 46)) * 100
        : (outs / 46) * 100;
      
      draws.push({
        type: 'flush',
        outs: 9,
        cards: allCards.filter(c => c.suit === suit),
        probability: Math.round(probability * 10) / 10,
      });
    } else if (count === 3 && cardsRemaining === 2) {
      // Backdoor flush draw
      draws.push({
        type: 'backdoor-flush',
        outs: 10,
        cards: allCards.filter(c => c.suit === suit),
        probability: 4.2, // Approximate
      });
    }
  }
  
  // Check for straight draws
  const straightDrawResult = findStraightDraw(allCards);
  if (straightDrawResult) {
    draws.push(straightDrawResult);
  }
  
  // Check for overcards (if no pair made)
  const overcardsResult = findOvercards(holeCards, communityCards);
  if (overcardsResult) {
    draws.push(overcardsResult);
  }
  
  return draws;
}

/**
 * Find straight draws
 */
function findStraightDraw(cards: Card[]): DrawInfo | null {
  const values = [...new Set(cards.map(c => getRankValue(c.rank)))].sort((a, b) => a - b);
  
  // Check for OESD (8 outs)
  for (let i = 0; i <= values.length - 4; i++) {
    const window = values.slice(i, i + 4);
    if (window[3] - window[0] === 3) {
      // 4 consecutive cards
      return {
        type: 'straight',
        outs: 8,
        cards: cards.filter(c => window.includes(getRankValue(c.rank))),
        probability: 31.5, // Approximate for flop to river
      };
    }
  }
  
  // Check for gutshot (4 outs)
  for (let i = 0; i <= values.length - 4; i++) {
    const window = values.slice(i, i + 4);
    if (window[3] - window[0] === 4) {
      // One gap
      const gaps = [];
      for (let j = 1; j < window.length; j++) {
        if (window[j] - window[j - 1] === 2) {
          gaps.push(window[j] - 1);
        }
      }
      if (gaps.length === 1) {
        return {
          type: 'gutshot',
          outs: 4,
          cards: cards.filter(c => window.includes(getRankValue(c.rank))),
          probability: 16.5, // Approximate for flop to river
        };
      }
    }
  }
  
  return null;
}

/**
 * Find overcards
 */
function findOvercards(
  holeCards: Card[],
  communityCards: Card[]
): DrawInfo | null {
  if (communityCards.length === 0) return null;
  
  const boardHigh = Math.max(...communityCards.map(c => getRankValue(c.rank)));
  const overcards = holeCards.filter(c => getRankValue(c.rank) > boardHigh);
  
  if (overcards.length === 0) return null;
  
  // Each overcard has 3 outs to pair
  const outs = overcards.length * 3;
  const probability = outs === 6 ? 24.1 : 12.8; // Approximate
  
  return {
    type: 'overcards',
    outs,
    cards: overcards,
    probability,
  };
}

// ============================================================================
// NUT ANALYSIS
// ============================================================================

export interface NutHand {
  description: string;
  hand: string; // e.g., "AA" or "As Ks"
  ranking: number; // 1 = nuts, 2 = second nuts, etc.
}

/**
 * Determine the nuts and near-nuts for a given board
 */
export function findNuts(communityCards: Card[]): NutHand[] {
  if (communityCards.length < 3) {
    return [{ description: 'Any hand', hand: '??', ranking: 1 }];
  }
  
  const nuts: NutHand[] = [];
  const boardTexture = analyzeBoardTexture(communityCards);
  
  // Check for made flushes/straights first
  const suitCounts = getSuitCounts(communityCards);
  const hasThreeOfSuit = [...suitCounts.values()].some(c => c >= 3);
  
  if (hasThreeOfSuit) {
    const flushSuit = [...suitCounts.entries()].find(([, c]) => c >= 3)?.[0];
    if (flushSuit) {
      const suitChar = flushSuit[0].toUpperCase();
      nuts.push({
        description: `Nut Flush (A${suitChar})`,
        hand: `A${suitChar} x${suitChar}`,
        ranking: 1,
      });
    }
  }
  
  // Check for sets/full houses on paired board
  if (boardTexture.isPaired && boardTexture.pairRank) {
    nuts.push({
      description: `Quads (${boardTexture.pairRank}${boardTexture.pairRank})`,
      hand: `${boardTexture.pairRank}${boardTexture.pairRank}`,
      ranking: nuts.length + 1,
    });
  }
  
  // Top set
  const sortedRanks = [...new Set(communityCards.map(c => c.rank))]
    .sort((a, b) => getRankValue(b) - getRankValue(a));
  
  if (sortedRanks.length > 0) {
    nuts.push({
      description: `Set of ${sortedRanks[0]}s`,
      hand: `${sortedRanks[0]}${sortedRanks[0]}`,
      ranking: nuts.length + 1,
    });
  }
  
  // Top two pair
  if (sortedRanks.length >= 2) {
    nuts.push({
      description: `Top Two Pair (${sortedRanks[0]}s and ${sortedRanks[1]}s)`,
      hand: `${sortedRanks[0]}${sortedRanks[1]}`,
      ranking: nuts.length + 1,
    });
  }
  
  // Top pair top kicker
  if (sortedRanks.length > 0) {
    nuts.push({
      description: `Top Pair Top Kicker (${sortedRanks[0]}s with A)`,
      hand: `A${sortedRanks[0]}`,
      ranking: nuts.length + 1,
    });
  }
  
  return nuts.slice(0, 5);
}

// ============================================================================
// DANGER CARDS
// ============================================================================

export interface DangerCard {
  rank: Rank;
  suit?: Suit;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Find cards that could be dangerous on turn/river
 */
export function findDangerCards(
  communityCards: Card[],
  heroCards?: Card[]
): DangerCard[] {
  const dangers: DangerCard[] = [];
  const texture = analyzeBoardTexture(communityCards);
  
  // Flush completing cards
  if (texture.flushDrawSuit) {
    dangers.push({
      suit: texture.flushDrawSuit,
      rank: 'A', // Any card of this suit
      reason: `Completes flush draw`,
      severity: 'high',
    });
  }
  
  // Straight completing cards
  const values = communityCards.map(c => getRankValue(c.rank));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  
  // Cards that could complete straights
  for (let v = Math.max(2, minVal - 2); v <= Math.min(14, maxVal + 2); v++) {
    const rank = RANKS.find(r => RANK_VALUES[r] === v);
    if (rank && !values.includes(v)) {
      const wouldConnect = values.filter(cv => Math.abs(cv - v) <= 4).length >= 3;
      if (wouldConnect) {
        dangers.push({
          rank,
          reason: 'Could complete straight',
          severity: 'medium',
        });
      }
    }
  }
  
  // Board pairing cards
  for (const card of communityCards) {
    if (!dangers.some(d => d.rank === card.rank)) {
      dangers.push({
        rank: card.rank,
        reason: 'Pairs the board (full house possible)',
        severity: 'medium',
      });
    }
  }
  
  // Overcards to the board
  const highCard = getRankValue(texture.highCard);
  for (const rank of RANKS) {
    if (getRankValue(rank) > highCard && !dangers.some(d => d.rank === rank)) {
      dangers.push({
        rank,
        reason: 'Overcard to board',
        severity: 'low',
      });
    }
  }
  
  return dangers.slice(0, 10);
}
