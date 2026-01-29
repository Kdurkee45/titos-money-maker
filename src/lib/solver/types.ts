/**
 * GTO Solver Types
 */

import { Card, Rank } from '@/lib/poker/types';

// Action in the game tree
export type SolverAction = 'fold' | 'check' | 'call' | 'bet_small' | 'bet_medium' | 'bet_large' | 'bet_pot' | 'bet_allin';

// Game tree node type
export type NodeType = 'chance' | 'player' | 'terminal';

// Player ID (0 = OOP, 1 = IP)
export type PlayerId = 0 | 1;

// Information set key (for storing strategies)
export type InfoSetKey = string;

// Strategy (action -> probability)
export type Strategy = Map<SolverAction, number>;

// Game tree node
export interface GameNode {
  type: NodeType;
  player: PlayerId | null;
  actions: SolverAction[];
  children: Map<SolverAction, GameNode>;
  pot: number;
  stacks: [number, number];
  street: 'preflop' | 'flop' | 'turn' | 'river';
  bets: [number, number]; // Current bets for each player
  isTerminal: boolean;
  terminalValue?: number; // Only for terminal nodes
}

// Information set (state from a player's perspective)
export interface InfoSet {
  key: InfoSetKey;
  player: PlayerId;
  hand: string; // Hand notation like "AKs"
  board: string; // Board notation like "Kh7s2c"
  actions: string; // Action history like "xbc" (check, bet, call)
  
  // CFR values
  regretSum: Map<SolverAction, number>;
  strategySum: Map<SolverAction, number>;
  
  // Current strategy
  strategy: Strategy;
}

// Solver configuration
export interface SolverConfig {
  // Stack sizes in BB
  stackSize: number;
  
  // Pot size at start of solving
  potSize: number;
  
  // Bet sizings to consider (as fraction of pot)
  betSizings: number[];
  
  // Raise sizings
  raiseSizings: number[];
  
  // Maximum number of raises per street
  maxRaisesPerStreet: number;
  
  // Number of CFR iterations
  iterations: number;
  
  // Board cards
  board: Card[];
  
  // Player ranges (hand notation -> weight)
  ranges: [Map<string, number>, Map<string, number>];
}

// Solver result
export interface SolverResult {
  // Strategies for each player
  strategies: Map<InfoSetKey, Strategy>;
  
  // Exploitability (how far from Nash equilibrium)
  exploitability: number;
  
  // Expected value for OOP player
  evOOP: number;
  
  // Expected value for IP player
  evIP: number;
  
  // Number of iterations run
  iterations: number;
  
  // Solving time in ms
  solvingTime: number;
}

// Recommendation for a specific spot
export interface SpotRecommendation {
  actions: Array<{
    action: SolverAction;
    frequency: number;
    ev: number;
  }>;
  explanation: string;
}

// Hand range
export interface HandRange {
  hands: Map<string, number>; // hand notation -> weight (0-1)
  combos: number; // Total number of combinations
}
