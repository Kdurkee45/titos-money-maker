/**
 * Core Poker Types for the Math Library
 * 
 * This file contains the canonical types for all poker calculations.
 * These are used by the hand evaluator, equity calculator, and GTO solver.
 * 
 * NOTE: This application is designed exclusively for Texas Hold 'Em poker.
 * - 2 hole cards per player
 * - 5 community cards (flop: 3, turn: 1, river: 1)
 * - Standard 52-card deck (4 suits × 13 ranks)
 * - 10 hand rankings (high card through royal flush)
 */

// Card ranks in order (2 is lowest, A is highest)
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
export type Rank = typeof RANKS[number];

// Card suits
export const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'] as const;
export type Suit = typeof SUITS[number];

// Single card
export interface Card {
  rank: Rank;
  suit: Suit;
}

// Numeric values for ranks (for comparison)
export const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

// Hand rankings from worst to best
export const HAND_RANKINGS = [
  'high-card',
  'pair',
  'two-pair',
  'three-of-a-kind',
  'straight',
  'flush',
  'full-house',
  'four-of-a-kind',
  'straight-flush',
  'royal-flush',
] as const;
export type HandRanking = typeof HAND_RANKINGS[number];

// Numeric values for hand rankings
export const HAND_RANKING_VALUES: Record<HandRanking, number> = {
  'high-card': 1,
  'pair': 2,
  'two-pair': 3,
  'three-of-a-kind': 4,
  'straight': 5,
  'flush': 6,
  'full-house': 7,
  'four-of-a-kind': 8,
  'straight-flush': 9,
  'royal-flush': 10,
};

// Evaluated hand result
export interface EvaluatedHand {
  ranking: HandRanking;
  rankValue: number;
  cards: Card[]; // The 5 cards that make the hand
  kickers: Rank[]; // Kicker cards for tie-breaking
  description: string; // Human-readable description
  score: number; // Numeric score for comparison (higher is better)
}

// Position type
export type Position = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'MP' | 'MP+1' | 'HJ' | 'CO';

// Street type
export type Street = 'preflop' | 'flop' | 'turn' | 'river';

// Action type
export type Action = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

// Hand range (for GTO analysis)
export type HandRange = Map<string, number>; // hand notation -> frequency (0-1)

// Equity result
export interface EquityResult {
  win: number;
  tie: number;
  lose: number;
  samples: number;
}

// Board texture analysis
export interface BoardTexture {
  isPaired: boolean;
  pairRank: Rank | null;
  isTrips: boolean;
  isMonotone: boolean;
  isTwoTone: boolean;
  isRainbow: boolean;
  flushSuit: Suit | null;
  flushDrawSuit: Suit | null;
  isConnected: boolean;
  hasGutshot: boolean;
  hasOESD: boolean;
  highCard: Rank;
  texture: 'dry' | 'semi-wet' | 'wet';
  dangerLevel: 'low' | 'medium' | 'high';
}

// Draw information
export interface DrawInfo {
  type: 'flush' | 'straight' | 'gutshot' | 'overcards' | 'backdoor-flush' | 'backdoor-straight';
  outs: number;
  cards: Card[];
  probability: number; // Probability to hit by river
}
