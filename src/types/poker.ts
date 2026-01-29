/**
 * Poker Types for UI Components
 * 
 * This file contains types used by the frontend React components.
 * For core poker math types, see @/lib/poker/types.ts
 * For database types, see @/types/database.ts
 * 
 * NOTE: This application is designed exclusively for Texas Hold 'Em poker.
 * - 2 hole cards per player
 * - 5 community cards (flop: 3, turn: 1, river: 1)
 * - Standard 52-card deck
 * - 10 hand rankings (high card through royal flush)
 */

// Card types
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

export interface Card {
  rank: Rank;
  suit: Suit;
}

// Player personas (aligned with database schema)
export type PersonaType = 
  | 'aggressive' 
  | 'conservative' 
  | 'bluffer' 
  | 'tight' 
  | 'loose' 
  | 'shark'
  | 'fish'
  | 'unknown';

export interface PlayerPersona {
  type: PersonaType;
  confidence: number; // 0-100
  traits: string[];
}

// Player statistics
export interface PlayerStats {
  // Core stats
  handsPlayed: number;
  handsWon: number;
  winRate: number; // BB/100
  
  // Pre-flop stats
  vpip: number; // Voluntarily Put In Pot %
  pfr: number; // Pre-Flop Raise %
  threeBet: number; // 3-Bet %
  foldToThreeBet: number; // Fold to 3-Bet %
  
  // Post-flop stats
  aggression: number; // Aggression Factor
  cbet: number; // Continuation Bet %
  foldToCbet: number; // Fold to C-Bet %
  wtsd: number; // Went to Showdown %
  wsd: number; // Won $ at Showdown %
  
  // Betting patterns
  avgBetSize: number; // In BB
  avgRaiseSize: number; // As multiplier
  bluffFrequency: number; // Estimated %
  
  // Position stats
  positionStats: {
    early: { vpip: number; pfr: number };
    middle: { vpip: number; pfr: number };
    late: { vpip: number; pfr: number };
    blinds: { vpip: number; pfr: number };
  };
  
  // Session stats
  sessionProfit: number;
  sessionHands: number;
  biggestPot: number;
}

// Table position
export type Position = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'MP' | 'MP+1' | 'HJ' | 'CO';

// Player action
export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in' | null;

export interface PlayerAction {
  type: ActionType;
  amount?: number;
  timestamp: number;
}

// Player at table
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  stack: number;
  position: Position;
  isHero: boolean;
  isActive: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  currentBet: number;
  holeCards?: Card[] | null; // 2 cards for Texas Hold 'Em
  persona: PlayerPersona;
  stats: PlayerStats;
  lastAction?: PlayerAction;
  notes?: string;
  colorLabel?: string;
}

// Hand strength
export type HandRanking = 
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush';

export interface HandStrength {
  ranking: HandRanking;
  rankingName: string;
  kickers: Rank[];
  percentile: number; // 0-100, how strong vs all possible hands
  description: string;
}

// Board texture
export interface BoardTexture {
  isPaired: boolean;
  isMonotone: boolean;
  isTwoTone: boolean;
  isRainbow: boolean;
  isConnected: boolean;
  hasFlushDraw: boolean;
  hasStraightDraw: boolean;
  highCard: Rank;
  texture: 'dry' | 'wet' | 'semi-wet';
  dangerLevel: 'low' | 'medium' | 'high';
}

// Outs and draws (aligned with backend types)
export interface DrawInfo {
  type: 'flush' | 'straight' | 'gutshot' | 'overcards' | 'backdoor-flush' | 'backdoor-straight';
  outs: number;
  probability: number;
  cards: Card[];
}

// Equity calculation
export interface EquityResult {
  win: number;
  tie: number;
  lose: number;
  samples: number;
}

// GTO recommendation
export interface GTOAction {
  action: ActionType;
  frequency: number; // 0-100
  ev: number; // Expected Value in BB
  sizing?: number; // Bet/raise sizing
  isPrimary: boolean;
}

export interface GTORecommendation {
  situation: string;
  actions: GTOAction[];
  explanation: string;
  exploitativeAdjustment?: string;
}

// Pot odds
export interface PotOdds {
  potSize: number;
  toCall: number;
  odds: number; // As percentage
  impliedOdds: number;
  requiredEquity: number;
  isGoodCall: boolean;
}

// Betting round
export type Street = 'preflop' | 'flop' | 'turn' | 'river';

// Game state
export interface GameState {
  // Table info
  tableId: string;
  tableName: string;
  gameType: 'cash' | 'tournament';
  stakes: string;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  
  // Current hand
  handNumber: number;
  street: Street;
  pot: number;
  sidePots: number[];
  communityCards: Card[];
  
  // Players
  players: Player[];
  heroId: string;
  dealerPosition: number;
  activePlayerId: string;
  
  // Action
  currentBet: number;
  minRaise: number;
  
  // Timing
  timeBank: number;
  actionTimer: number;
}

// Hand history entry
export interface HandHistoryEntry {
  handNumber: number;
  timestamp: number;
  players: string[];
  heroCards: Card[]; // 2 cards for Texas Hold 'Em
  communityCards: Card[];
  pot: number;
  result: 'won' | 'lost' | 'folded';
  profit: number;
  showdown: boolean;
  actions: Array<{
    street: Street;
    player: string;
    action: ActionType;
    amount?: number;
  }>;
}

// Range definition (for hand matrix)
export interface HandRange {
  hands: Set<string>; // e.g., "AKs", "QQ", "87o"
  weight: number; // 0-1
}

// Alert/notification
export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  timestamp: number;
  dismissed: boolean;
}
