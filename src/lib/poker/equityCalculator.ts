/**
 * Monte Carlo Equity Calculator
 * Calculates win/tie/lose percentages through simulation
 */

import { Card, Rank, Suit, RANKS, SUITS, EquityResult } from './types';
import { evaluateHand, compareHands } from './handEvaluator';

// ============================================================================
// DECK UTILITIES
// ============================================================================

/**
 * Create a full 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * Check if two cards are the same
 */
export function isSameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

/**
 * Remove specific cards from deck
 */
export function removeCards(deck: Card[], cardsToRemove: Card[]): Card[] {
  return deck.filter(card => 
    !cardsToRemove.some(remove => isSameCard(card, remove))
  );
}

/**
 * Fisher-Yates shuffle
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Draw n cards from a shuffled deck
 */
export function drawCards(deck: Card[], n: number): Card[] {
  const shuffled = shuffle(deck);
  return shuffled.slice(0, n);
}

// ============================================================================
// EQUITY CALCULATION
// ============================================================================

export interface EquityInput {
  heroCards: Card[];
  villainCards?: Card[]; // If known (e.g., all-in showdown)
  communityCards: Card[];
  numOpponents: number;
  numSimulations: number;
}

/**
 * Run a single simulation
 * Returns: 1 for hero win, 0.5 for tie, 0 for loss
 */
function runSimulation(
  heroCards: Card[],
  communityCards: Card[],
  deck: Card[],
  numOpponents: number
): number {
  // Cards needed to complete the board
  const boardCardsNeeded = 5 - communityCards.length;
  
  // Cards needed for opponents (2 each)
  const opponentCardsNeeded = numOpponents * 2;
  
  // Total cards to draw
  const totalNeeded = boardCardsNeeded + opponentCardsNeeded;
  
  // Draw random cards
  const drawnCards = drawCards(deck, totalNeeded);
  
  // Complete the board
  const fullBoard = [...communityCards, ...drawnCards.slice(0, boardCardsNeeded)];
  
  // Hero's full hand
  const heroFullHand = [...heroCards, ...fullBoard];
  const heroEval = evaluateHand(heroFullHand);
  
  // Evaluate opponent hands
  let heroWins = true;
  let tieCount = 0;
  let opponentCardIndex = boardCardsNeeded;
  
  for (let i = 0; i < numOpponents; i++) {
    const oppCards = [
      drawnCards[opponentCardIndex++],
      drawnCards[opponentCardIndex++],
    ];
    const oppFullHand = [...oppCards, ...fullBoard];
    const oppEval = evaluateHand(oppFullHand);
    
    const comparison = compareHands(heroEval, oppEval);
    
    if (comparison < 0) {
      // Opponent wins
      return 0;
    } else if (comparison === 0) {
      tieCount++;
    }
  }
  
  // If we got here, hero didn't lose
  if (tieCount > 0) {
    // Tie with at least one opponent
    return 0.5;
  }
  
  return 1; // Hero wins
}

/**
 * Calculate equity through Monte Carlo simulation
 */
export function calculateEquity(input: EquityInput): EquityResult {
  const { heroCards, communityCards, numOpponents, numSimulations } = input;
  
  // Create deck and remove known cards
  let deck = createDeck();
  deck = removeCards(deck, heroCards);
  deck = removeCards(deck, communityCards);
  
  // If villain cards are known, remove them too
  if (input.villainCards) {
    deck = removeCards(deck, input.villainCards);
  }
  
  let wins = 0;
  let ties = 0;
  
  for (let i = 0; i < numSimulations; i++) {
    const result = runSimulation(heroCards, communityCards, deck, numOpponents);
    if (result === 1) wins++;
    else if (result === 0.5) ties++;
  }
  
  const winPct = (wins / numSimulations) * 100;
  const tiePct = (ties / numSimulations) * 100;
  const losePct = 100 - winPct - tiePct;
  
  return {
    win: Math.round(winPct * 10) / 10,
    tie: Math.round(tiePct * 10) / 10,
    lose: Math.round(losePct * 10) / 10,
    samples: numSimulations,
  };
}

/**
 * Calculate equity against a specific range
 * Range is a map of hand notation to frequency (0-1)
 */
export function calculateEquityVsRange(
  heroCards: Card[],
  communityCards: Card[],
  villainRange: Map<string, number>,
  numSimulationsPerHand: number = 100
): EquityResult {
  let totalWeight = 0;
  let weightedWins = 0;
  let weightedTies = 0;
  
  // Iterate through all hands in the range
  for (const [handNotation, frequency] of villainRange) {
    if (frequency === 0) continue;
    
    // Parse the hand notation to get actual cards
    const villainHands = expandHandNotation(handNotation, heroCards, communityCards);
    
    for (const villainCards of villainHands) {
      // Run simulation for this specific matchup
      let deck = createDeck();
      deck = removeCards(deck, heroCards);
      deck = removeCards(deck, communityCards);
      deck = removeCards(deck, villainCards);
      
      let wins = 0;
      let ties = 0;
      
      for (let i = 0; i < numSimulationsPerHand; i++) {
        const boardCardsNeeded = 5 - communityCards.length;
        const drawnCards = drawCards(deck, boardCardsNeeded);
        const fullBoard = [...communityCards, ...drawnCards];
        
        const heroFullHand = [...heroCards, ...fullBoard];
        const villainFullHand = [...villainCards, ...fullBoard];
        
        const heroEval = evaluateHand(heroFullHand);
        const villainEval = evaluateHand(villainFullHand);
        
        const comparison = compareHands(heroEval, villainEval);
        if (comparison > 0) wins++;
        else if (comparison === 0) ties++;
      }
      
      const weight = frequency / villainHands.length;
      totalWeight += weight;
      weightedWins += (wins / numSimulationsPerHand) * weight;
      weightedTies += (ties / numSimulationsPerHand) * weight;
    }
  }
  
  if (totalWeight === 0) {
    return { win: 0, tie: 0, lose: 100, samples: 0 };
  }
  
  const winPct = (weightedWins / totalWeight) * 100;
  const tiePct = (weightedTies / totalWeight) * 100;
  
  return {
    win: Math.round(winPct * 10) / 10,
    tie: Math.round(tiePct * 10) / 10,
    lose: Math.round((100 - winPct - tiePct) * 10) / 10,
    samples: numSimulationsPerHand * villainRange.size,
  };
}

/**
 * Expand hand notation to all possible card combinations
 * e.g., "AKs" -> all suited AK combos, "QQ" -> all QQ combos
 */
function expandHandNotation(
  notation: string,
  blockedCards: Card[],
  moreBlockedCards: Card[] = []
): Card[][] {
  const allBlocked = [...blockedCards, ...moreBlockedCards];
  const results: Card[][] = [];
  
  // Parse notation
  const rank1 = notation[0] as Rank;
  const rank2 = notation[1] as Rank;
  const suited = notation.includes('s');
  const offsuit = notation.includes('o');
  const isPair = rank1 === rank2;
  
  if (isPair) {
    // Pair: all 6 combos
    for (let i = 0; i < SUITS.length; i++) {
      for (let j = i + 1; j < SUITS.length; j++) {
        const card1: Card = { rank: rank1, suit: SUITS[i] };
        const card2: Card = { rank: rank1, suit: SUITS[j] };
        
        if (!allBlocked.some(b => isSameCard(b, card1)) &&
            !allBlocked.some(b => isSameCard(b, card2))) {
          results.push([card1, card2]);
        }
      }
    }
  } else if (suited) {
    // Suited: 4 combos
    for (const suit of SUITS) {
      const card1: Card = { rank: rank1, suit };
      const card2: Card = { rank: rank2, suit };
      
      if (!allBlocked.some(b => isSameCard(b, card1)) &&
          !allBlocked.some(b => isSameCard(b, card2))) {
        results.push([card1, card2]);
      }
    }
  } else {
    // Offsuit or unspecified: 12 combos (or 16 if unspecified)
    for (const suit1 of SUITS) {
      for (const suit2 of SUITS) {
        if (suited && suit1 !== suit2) continue;
        if (offsuit && suit1 === suit2) continue;
        
        const card1: Card = { rank: rank1, suit: suit1 };
        const card2: Card = { rank: rank2, suit: suit2 };
        
        if (!allBlocked.some(b => isSameCard(b, card1)) &&
            !allBlocked.some(b => isSameCard(b, card2))) {
          results.push([card1, card2]);
        }
      }
    }
  }
  
  return results;
}

// ============================================================================
// OUTS AND DRAW ODDS
// ============================================================================

/**
 * Calculate probability of hitting with given outs
 */
export function calculateDrawOdds(outs: number, street: 'flop' | 'turn' | 'river'): number {
  if (street === 'flop') {
    // Two cards to come
    const missOne = (47 - outs) / 47;
    const missTwo = (46 - outs) / 46;
    return (1 - (missOne * missTwo)) * 100;
  } else if (street === 'turn') {
    // One card to come
    return (outs / 46) * 100;
  } else {
    // River - no more cards
    return 0;
  }
}

/**
 * Quick pot odds check
 */
export function isProfitableCall(
  potSize: number,
  callAmount: number,
  equity: number
): boolean {
  const potOdds = callAmount / (potSize + callAmount) * 100;
  return equity > potOdds;
}

/**
 * Calculate required equity for a profitable call
 */
export function requiredEquity(potSize: number, callAmount: number): number {
  return (callAmount / (potSize + callAmount)) * 100;
}
