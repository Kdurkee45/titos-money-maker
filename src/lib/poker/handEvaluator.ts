/**
 * Poker Hand Evaluator
 * Evaluates 5-7 card hands and returns the best 5-card hand ranking
 */

import {
  Card,
  Rank,
  Suit,
  RANKS,
  SUITS,
  RANK_VALUES,
  HandRanking,
  HAND_RANKING_VALUES,
  EvaluatedHand,
} from './types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get numeric value for a rank
 */
export function getRankValue(rank: Rank): number {
  return RANK_VALUES[rank];
}

/**
 * Compare two ranks (returns positive if a > b, negative if a < b, 0 if equal)
 */
export function compareRanks(a: Rank, b: Rank): number {
  return RANK_VALUES[a] - RANK_VALUES[b];
}

/**
 * Sort cards by rank (descending)
 */
export function sortByRank(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => compareRanks(b.rank, a.rank));
}

/**
 * Get all unique ranks from cards
 */
function getRankCounts(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  }
  return counts;
}

/**
 * Get all unique suits from cards
 */
function getSuitCounts(cards: Card[]): Map<Suit, number> {
  const counts = new Map<Suit, number>();
  for (const card of cards) {
    counts.set(card.suit, (counts.get(card.suit) || 0) + 1);
  }
  return counts;
}

/**
 * Generate all combinations of size k from array
 */
function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (arr.length < k) return;
  
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first, ...combo];
  }
  for (const combo of combinations(rest, k)) {
    yield combo;
  }
}

// ============================================================================
// HAND DETECTION FUNCTIONS
// ============================================================================

/**
 * Check for flush (5+ cards of same suit)
 */
function findFlush(cards: Card[]): Card[] | null {
  const suitCounts = getSuitCounts(cards);
  
  for (const [suit, count] of suitCounts) {
    if (count >= 5) {
      const flushCards = cards.filter(c => c.suit === suit);
      return sortByRank(flushCards).slice(0, 5);
    }
  }
  return null;
}

/**
 * Check for straight (5 consecutive ranks)
 * Returns the cards forming the straight, or null
 */
function findStraight(cards: Card[]): Card[] | null {
  // Get unique ranks sorted descending
  const uniqueRanks = [...new Set(cards.map(c => c.rank))];
  uniqueRanks.sort((a, b) => compareRanks(b, a));
  
  // Check for A-2-3-4-5 (wheel) first
  const hasAce = uniqueRanks.includes('A');
  const wheelRanks: Rank[] = ['5', '4', '3', '2'];
  const hasWheel = hasAce && wheelRanks.every(r => uniqueRanks.includes(r));
  
  if (hasWheel) {
    const straightCards: Card[] = [];
    for (const rank of ['A', ...wheelRanks] as Rank[]) {
      const card = cards.find(c => c.rank === rank);
      if (card) straightCards.push(card);
    }
    // Reorder for wheel: 5-4-3-2-A
    return [
      straightCards.find(c => c.rank === '5')!,
      straightCards.find(c => c.rank === '4')!,
      straightCards.find(c => c.rank === '3')!,
      straightCards.find(c => c.rank === '2')!,
      straightCards.find(c => c.rank === 'A')!,
    ];
  }
  
  // Check for regular straights
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    const startRank = uniqueRanks[i];
    const startValue = getRankValue(startRank);
    
    let isConsecutive = true;
    const straightRanks: Rank[] = [startRank];
    
    for (let j = 1; j < 5; j++) {
      const expectedValue = startValue - j;
      const expectedRank = RANKS.find(r => RANK_VALUES[r] === expectedValue);
      
      if (!expectedRank || !uniqueRanks.includes(expectedRank)) {
        isConsecutive = false;
        break;
      }
      straightRanks.push(expectedRank);
    }
    
    if (isConsecutive) {
      const straightCards: Card[] = [];
      for (const rank of straightRanks) {
        const card = cards.find(c => c.rank === rank);
        if (card) straightCards.push(card);
      }
      return straightCards;
    }
  }
  
  return null;
}

/**
 * Check for straight flush
 */
function findStraightFlush(cards: Card[]): { cards: Card[]; isRoyal: boolean } | null {
  const suitCounts = getSuitCounts(cards);
  
  for (const [suit, count] of suitCounts) {
    if (count >= 5) {
      const suitedCards = cards.filter(c => c.suit === suit);
      const straight = findStraight(suitedCards);
      
      if (straight) {
        const isRoyal = straight[0].rank === 'A' && straight[1].rank === 'K';
        return { cards: straight, isRoyal };
      }
    }
  }
  return null;
}

// ============================================================================
// MAIN EVALUATOR
// ============================================================================

/**
 * Evaluate a 5-card hand
 */
function evaluate5CardHand(cards: Card[]): EvaluatedHand {
  if (cards.length !== 5) {
    throw new Error('Must provide exactly 5 cards');
  }
  
  const sorted = sortByRank(cards);
  const rankCounts = getRankCounts(cards);
  const suitCounts = getSuitCounts(cards);
  
  // Count occurrences
  const counts = [...rankCounts.values()].sort((a, b) => b - a);
  const isFlush = [...suitCounts.values()].some(c => c === 5);
  const straight = findStraight(cards);
  const isStraight = straight !== null;
  
  // Check for straight flush / royal flush
  if (isFlush && isStraight) {
    const sfResult = findStraightFlush(cards);
    if (sfResult?.isRoyal) {
      return {
        ranking: 'royal-flush',
        rankValue: HAND_RANKING_VALUES['royal-flush'],
        cards: sfResult.cards,
        kickers: [],
        description: 'Royal Flush',
        score: 10_00_00_00_00_00,
      };
    }
    if (sfResult) {
      const highCard = sfResult.cards[0].rank;
      return {
        ranking: 'straight-flush',
        rankValue: HAND_RANKING_VALUES['straight-flush'],
        cards: sfResult.cards,
        kickers: [],
        description: `Straight Flush, ${highCard} high`,
        score: 9_00_00_00_00_00 + getRankValue(highCard) * 100_00_00_00,
      };
    }
  }
  
  // Four of a kind
  if (counts[0] === 4) {
    const quadRank = [...rankCounts.entries()].find(([, c]) => c === 4)![0];
    const kicker = [...rankCounts.entries()].find(([, c]) => c === 1)![0];
    return {
      ranking: 'four-of-a-kind',
      rankValue: HAND_RANKING_VALUES['four-of-a-kind'],
      cards: sorted,
      kickers: [kicker],
      description: `Four of a Kind, ${quadRank}s`,
      score: 8_00_00_00_00_00 + getRankValue(quadRank) * 100_00_00_00 + getRankValue(kicker) * 1_00_00_00,
    };
  }
  
  // Full house
  if (counts[0] === 3 && counts[1] === 2) {
    const tripRank = [...rankCounts.entries()].find(([, c]) => c === 3)![0];
    const pairRank = [...rankCounts.entries()].find(([, c]) => c === 2)![0];
    return {
      ranking: 'full-house',
      rankValue: HAND_RANKING_VALUES['full-house'],
      cards: sorted,
      kickers: [],
      description: `Full House, ${tripRank}s full of ${pairRank}s`,
      score: 7_00_00_00_00_00 + getRankValue(tripRank) * 100_00_00_00 + getRankValue(pairRank) * 1_00_00_00,
    };
  }
  
  // Flush
  if (isFlush) {
    const flushCards = sortByRank(cards);
    const ranks = flushCards.map(c => c.rank);
    return {
      ranking: 'flush',
      rankValue: HAND_RANKING_VALUES['flush'],
      cards: flushCards,
      kickers: ranks.slice(1),
      description: `Flush, ${ranks[0]} high`,
      score: 6_00_00_00_00_00 + 
        getRankValue(ranks[0]) * 100_00_00_00 +
        getRankValue(ranks[1]) * 1_00_00_00 +
        getRankValue(ranks[2]) * 10000 +
        getRankValue(ranks[3]) * 100 +
        getRankValue(ranks[4]),
    };
  }
  
  // Straight
  if (isStraight && straight) {
    const highCard = straight[0].rank;
    // Special case for wheel (A-2-3-4-5): high card is 5
    const effectiveHigh = highCard === '5' && straight[4].rank === 'A' ? '5' : highCard;
    return {
      ranking: 'straight',
      rankValue: HAND_RANKING_VALUES['straight'],
      cards: straight,
      kickers: [],
      description: `Straight, ${effectiveHigh} high`,
      score: 5_00_00_00_00_00 + getRankValue(effectiveHigh) * 100_00_00_00,
    };
  }
  
  // Three of a kind
  if (counts[0] === 3) {
    const tripRank = [...rankCounts.entries()].find(([, c]) => c === 3)![0];
    const kickers = [...rankCounts.entries()]
      .filter(([, c]) => c === 1)
      .map(([r]) => r)
      .sort((a, b) => compareRanks(b, a));
    return {
      ranking: 'three-of-a-kind',
      rankValue: HAND_RANKING_VALUES['three-of-a-kind'],
      cards: sorted,
      kickers,
      description: `Three of a Kind, ${tripRank}s`,
      score: 4_00_00_00_00_00 + 
        getRankValue(tripRank) * 100_00_00_00 +
        getRankValue(kickers[0]) * 1_00_00_00 +
        getRankValue(kickers[1]) * 10000,
    };
  }
  
  // Two pair
  if (counts[0] === 2 && counts[1] === 2) {
    const pairs = [...rankCounts.entries()]
      .filter(([, c]) => c === 2)
      .map(([r]) => r)
      .sort((a, b) => compareRanks(b, a));
    const kicker = [...rankCounts.entries()].find(([, c]) => c === 1)![0];
    return {
      ranking: 'two-pair',
      rankValue: HAND_RANKING_VALUES['two-pair'],
      cards: sorted,
      kickers: [kicker],
      description: `Two Pair, ${pairs[0]}s and ${pairs[1]}s`,
      score: 3_00_00_00_00_00 + 
        getRankValue(pairs[0]) * 100_00_00_00 +
        getRankValue(pairs[1]) * 1_00_00_00 +
        getRankValue(kicker) * 10000,
    };
  }
  
  // One pair
  if (counts[0] === 2) {
    const pairRank = [...rankCounts.entries()].find(([, c]) => c === 2)![0];
    const kickers = [...rankCounts.entries()]
      .filter(([, c]) => c === 1)
      .map(([r]) => r)
      .sort((a, b) => compareRanks(b, a));
    return {
      ranking: 'pair',
      rankValue: HAND_RANKING_VALUES['pair'],
      cards: sorted,
      kickers,
      description: `Pair of ${pairRank}s`,
      score: 2_00_00_00_00_00 + 
        getRankValue(pairRank) * 100_00_00_00 +
        getRankValue(kickers[0]) * 1_00_00_00 +
        getRankValue(kickers[1]) * 10000 +
        getRankValue(kickers[2]) * 100,
    };
  }
  
  // High card
  const ranks = sorted.map(c => c.rank);
  return {
    ranking: 'high-card',
    rankValue: HAND_RANKING_VALUES['high-card'],
    cards: sorted,
    kickers: ranks.slice(1),
    description: `${ranks[0]} High`,
    score: 1_00_00_00_00_00 + 
      getRankValue(ranks[0]) * 100_00_00_00 +
      getRankValue(ranks[1]) * 1_00_00_00 +
      getRankValue(ranks[2]) * 10000 +
      getRankValue(ranks[3]) * 100 +
      getRankValue(ranks[4]),
  };
}

/**
 * Evaluate the best 5-card hand from 5-7 cards
 */
export function evaluateHand(cards: Card[]): EvaluatedHand {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error('Must provide 5-7 cards');
  }
  
  if (cards.length === 5) {
    return evaluate5CardHand(cards);
  }
  
  // Find the best 5-card combination
  let bestHand: EvaluatedHand | null = null;
  
  for (const combo of combinations(cards, 5)) {
    const hand = evaluate5CardHand(combo);
    if (!bestHand || hand.score > bestHand.score) {
      bestHand = hand;
    }
  }
  
  return bestHand!;
}

/**
 * Compare two evaluated hands
 * Returns positive if hand1 wins, negative if hand2 wins, 0 if tie
 */
export function compareHands(hand1: EvaluatedHand, hand2: EvaluatedHand): number {
  return hand1.score - hand2.score;
}

/**
 * Get hand strength as percentile (0-100)
 * Based on the number of possible hands this hand beats
 */
export function getHandPercentile(hand: EvaluatedHand): number {
  // Approximate percentiles for each hand ranking
  const percentiles: Record<HandRanking, [number, number]> = {
    'high-card': [0, 17.4],
    'pair': [17.4, 60.1],
    'two-pair': [60.1, 64.9],
    'three-of-a-kind': [64.9, 67.0],
    'straight': [67.0, 67.5],
    'flush': [67.5, 69.5],
    'full-house': [69.5, 72.1],
    'four-of-a-kind': [72.1, 72.2],
    'straight-flush': [72.2, 72.21],
    'royal-flush': [72.21, 72.22],
  };
  
  const [min, max] = percentiles[hand.ranking];
  const range = max - min;
  
  // Interpolate within the ranking based on score
  // This is a rough approximation
  const rankingScore = hand.score % 100_00_00_00_00;
  const maxPossibleScore = 14 * 100_00_00_00; // Max rank value
  const withinRanking = rankingScore / maxPossibleScore;
  
  return min + (range * withinRanking);
}

/**
 * Create a card from string notation (e.g., "As", "Kh", "2c")
 */
export function parseCard(notation: string): Card {
  if (notation.length !== 2) {
    throw new Error(`Invalid card notation: ${notation}`);
  }
  
  const rankChar = notation[0].toUpperCase();
  const suitChar = notation[1].toLowerCase();
  
  const rank = rankChar === '1' ? 'T' : rankChar as Rank;
  
  const suitMap: Record<string, Suit> = {
    's': 'spades',
    'h': 'hearts',
    'd': 'diamonds',
    'c': 'clubs',
  };
  
  const suit = suitMap[suitChar];
  
  if (!RANKS.includes(rank as Rank)) {
    throw new Error(`Invalid rank: ${rankChar}`);
  }
  if (!suit) {
    throw new Error(`Invalid suit: ${suitChar}`);
  }
  
  return { rank: rank as Rank, suit };
}

/**
 * Convert card to string notation
 */
export function cardToString(card: Card): string {
  const suitChars: Record<Suit, string> = {
    spades: 's',
    hearts: 'h',
    diamonds: 'd',
    clubs: 'c',
  };
  return `${card.rank}${suitChars[card.suit]}`;
}

/**
 * Parse multiple cards from notation (e.g., "AsKs" or "As Ks")
 */
export function parseCards(notation: string): Card[] {
  const cleaned = notation.replace(/\s+/g, '');
  const cards: Card[] = [];
  
  for (let i = 0; i < cleaned.length; i += 2) {
    cards.push(parseCard(cleaned.slice(i, i + 2)));
  }
  
  return cards;
}
