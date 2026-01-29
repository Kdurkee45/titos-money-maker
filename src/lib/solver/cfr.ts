/**
 * Counterfactual Regret Minimization (CFR) Algorithm
 * Computes Nash equilibrium strategies for poker
 */

import { 
  SolverAction, 
  PlayerId, 
  Strategy, 
  InfoSet, 
  InfoSetKey,
  SolverConfig,
  SolverResult,
  GameNode
} from './types';
import { buildGameTree } from './gameTree';
import { calculateEquity, createDeck } from '@/lib/poker/equityCalculator';
import { Card } from '@/lib/poker/types';

// Information set storage
const infoSets = new Map<InfoSetKey, InfoSet>();

/**
 * Get or create an information set
 */
function getInfoSet(
  key: InfoSetKey,
  player: PlayerId,
  actions: SolverAction[]
): InfoSet {
  if (infoSets.has(key)) {
    return infoSets.get(key)!;
  }
  
  const regretSum = new Map<SolverAction, number>();
  const strategySum = new Map<SolverAction, number>();
  const strategy = new Map<SolverAction, number>();
  
  // Initialize with uniform strategy
  for (const action of actions) {
    regretSum.set(action, 0);
    strategySum.set(action, 0);
    strategy.set(action, 1 / actions.length);
  }
  
  const infoSet: InfoSet = {
    key,
    player,
    hand: '',
    board: '',
    actions: '',
    regretSum,
    strategySum,
    strategy,
  };
  
  infoSets.set(key, infoSet);
  return infoSet;
}

/**
 * Get current strategy using regret matching
 */
function getStrategy(infoSet: InfoSet): Strategy {
  const actions = [...infoSet.regretSum.keys()];
  const strategy = new Map<SolverAction, number>();
  
  // Sum positive regrets
  let regretTotal = 0;
  for (const action of actions) {
    const regret = infoSet.regretSum.get(action) || 0;
    regretTotal += Math.max(0, regret);
  }
  
  // Calculate strategy proportional to positive regrets
  for (const action of actions) {
    if (regretTotal > 0) {
      const regret = Math.max(0, infoSet.regretSum.get(action) || 0);
      strategy.set(action, regret / regretTotal);
    } else {
      strategy.set(action, 1 / actions.length);
    }
  }
  
  return strategy;
}

/**
 * Get average strategy (the final equilibrium strategy)
 */
function getAverageStrategy(infoSet: InfoSet): Strategy {
  const actions = [...infoSet.strategySum.keys()];
  const strategy = new Map<SolverAction, number>();
  
  let total = 0;
  for (const action of actions) {
    total += infoSet.strategySum.get(action) || 0;
  }
  
  for (const action of actions) {
    if (total > 0) {
      strategy.set(action, (infoSet.strategySum.get(action) || 0) / total);
    } else {
      strategy.set(action, 1 / actions.length);
    }
  }
  
  return strategy;
}

/**
 * Generate information set key
 */
function generateInfoSetKey(
  player: PlayerId,
  hand: string,
  board: string,
  actionHistory: string
): InfoSetKey {
  return `${player}:${hand}:${board}:${actionHistory}`;
}

/**
 * Run a single CFR iteration
 */
function cfrIteration(
  node: GameNode,
  hands: [Card[], Card[]], // Each player's hole cards
  board: Card[],
  reachProbs: [number, number], // Probability of reaching this node for each player
  actionHistory: string
): number {
  // Terminal node - calculate payoff
  if (node.isTerminal) {
    return calculateShowdownValue(node, hands, board);
  }
  
  const player = node.player!;
  const opponent = (1 - player) as PlayerId;
  
  // Create info set key
  const handStr = hands[player].map(c => `${c.rank}${c.suit[0]}`).join('');
  const boardStr = board.map(c => `${c.rank}${c.suit[0]}`).join('');
  const infoSetKey = generateInfoSetKey(player, handStr, boardStr, actionHistory);
  
  // Get or create info set
  const infoSet = getInfoSet(infoSetKey, player, node.actions);
  
  // Get current strategy
  const strategy = getStrategy(infoSet);
  infoSet.strategy = strategy;
  
  // Calculate action values
  const actionValues = new Map<SolverAction, number>();
  let nodeValue = 0;
  
  for (const action of node.actions) {
    const childNode = node.children.get(action);
    if (!childNode) continue;
    
    const actionProb = strategy.get(action) || 0;
    const newReachProbs: [number, number] = [...reachProbs] as [number, number];
    newReachProbs[player] *= actionProb;
    
    const actionValue = -cfrIteration(
      childNode,
      hands,
      board,
      newReachProbs,
      actionHistory + action[0] // Use first char as action code
    );
    
    actionValues.set(action, actionValue);
    nodeValue += actionProb * actionValue;
  }
  
  // Update regrets and strategy sum
  for (const action of node.actions) {
    const actionValue = actionValues.get(action) || 0;
    const regret = actionValue - nodeValue;
    
    // Update regret sum
    const currentRegret = infoSet.regretSum.get(action) || 0;
    infoSet.regretSum.set(action, currentRegret + reachProbs[opponent] * regret);
    
    // Update strategy sum
    const currentStratSum = infoSet.strategySum.get(action) || 0;
    const stratProb = strategy.get(action) || 0;
    infoSet.strategySum.set(action, currentStratSum + reachProbs[player] * stratProb);
  }
  
  return nodeValue;
}

/**
 * Calculate showdown value at terminal node
 */
function calculateShowdownValue(
  node: GameNode,
  hands: [Card[], Card[]],
  board: Card[]
): number {
  // If there's a defined winner (someone folded), return pot to winner
  if (node.terminalValue !== undefined && node.terminalValue !== 0) {
    return node.terminalValue;
  }
  
  // Showdown - compare hands
  // Use equity calculation as approximation
  const equity = calculateEquity({
    heroCards: hands[0],
    villainCards: hands[1],
    communityCards: board,
    numOpponents: 1,
    numSimulations: 100, // Quick estimate
  });
  
  // Return expected value for player 0 (OOP)
  const potSize = node.pot;
  const evOOP = (equity.win / 100) * potSize - (equity.lose / 100) * potSize;
  
  return evOOP;
}

/**
 * Main CFR solver function
 */
export function solve(config: SolverConfig): SolverResult {
  const startTime = Date.now();
  
  // Clear previous info sets
  infoSets.clear();
  
  // Build game tree
  const gameTree = buildGameTree(config);
  
  // Get hands from ranges (simplified - just take top hands)
  const range0Hands = getHandsFromRange(config.ranges[0], 10);
  const range1Hands = getHandsFromRange(config.ranges[1], 10);
  
  // Run CFR iterations
  for (let i = 0; i < config.iterations; i++) {
    // Sample hands from each range
    for (const hand0 of range0Hands) {
      for (const hand1 of range1Hands) {
        // Skip if hands share cards
        if (handsOverlap(hand0, hand1, config.board)) continue;
        
        cfrIteration(
          gameTree,
          [hand0, hand1],
          config.board,
          [1, 1],
          ''
        );
      }
    }
  }
  
  // Extract final strategies
  const strategies = new Map<InfoSetKey, Strategy>();
  for (const [key, infoSet] of infoSets) {
    strategies.set(key, getAverageStrategy(infoSet));
  }
  
  // Calculate exploitability (simplified estimate)
  const exploitability = estimateExploitability(strategies);
  
  return {
    strategies,
    exploitability,
    evOOP: 0, // Would need more calculation
    evIP: 0,
    iterations: config.iterations,
    solvingTime: Date.now() - startTime,
  };
}

/**
 * Get specific hands from a range
 */
function getHandsFromRange(
  range: Map<string, number>,
  maxHands: number
): Card[][] {
  const hands: Card[][] = [];
  const deck = createDeck();
  
  // Sort by weight descending
  const sortedHands = [...range.entries()]
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxHands);
  
  for (const [notation] of sortedHands) {
    // Expand notation to actual cards
    const expanded = expandHandNotation(notation, deck);
    if (expanded.length > 0) {
      hands.push(expanded[0]); // Just take first combo
    }
  }
  
  return hands;
}

/**
 * Expand hand notation to card combinations
 */
function expandHandNotation(notation: string, deck: Card[]): Card[][] {
  const results: Card[][] = [];
  
  if (notation.length < 2) return results;
  
  const rank1 = notation[0];
  const rank2 = notation[1];
  const isSuited = notation.includes('s');
  const isOffsuit = notation.includes('o');
  
  // Find matching cards in deck
  const cards1 = deck.filter(c => c.rank === rank1);
  const cards2 = deck.filter(c => c.rank === rank2);
  
  for (const c1 of cards1) {
    for (const c2 of cards2) {
      if (c1 === c2) continue;
      if (c1.rank === c2.rank && c1.suit === c2.suit) continue;
      
      const sameSuit = c1.suit === c2.suit;
      if (isSuited && !sameSuit) continue;
      if (isOffsuit && sameSuit) continue;
      
      results.push([c1, c2]);
    }
  }
  
  return results;
}

/**
 * Check if hands share cards with each other or the board
 */
function handsOverlap(hand1: Card[], hand2: Card[], board: Card[]): boolean {
  const allCards = [...hand1, ...hand2, ...board];
  const seen = new Set<string>();
  
  for (const card of allCards) {
    const key = `${card.rank}${card.suit}`;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  
  return false;
}

/**
 * Estimate exploitability of strategies
 */
function estimateExploitability(strategies: Map<InfoSetKey, Strategy>): number {
  // Simplified estimate based on strategy variance
  let totalVariance = 0;
  let count = 0;
  
  for (const strategy of strategies.values()) {
    const probs = [...strategy.values()];
    const mean = probs.reduce((a, b) => a + b, 0) / probs.length;
    const variance = probs.reduce((a, b) => a + (b - mean) ** 2, 0) / probs.length;
    totalVariance += variance;
    count++;
  }
  
  // Higher variance often indicates strategies are still converging
  return count > 0 ? totalVariance / count : 1;
}

/**
 * Get strategy recommendation for a specific spot
 */
export function getRecommendation(
  hand: Card[],
  board: Card[],
  actionHistory: string,
  player: PlayerId,
  strategies: Map<InfoSetKey, Strategy>
): { action: SolverAction; probability: number; ev: number }[] {
  const handStr = hand.map(c => `${c.rank}${c.suit[0]}`).join('');
  const boardStr = board.map(c => `${c.rank}${c.suit[0]}`).join('');
  const key = generateInfoSetKey(player, handStr, boardStr, actionHistory);
  
  const strategy = strategies.get(key);
  if (!strategy) {
    return [];
  }
  
  const recommendations: { action: SolverAction; probability: number; ev: number }[] = [];
  
  for (const [action, probability] of strategy) {
    if (probability > 0.01) { // Only include actions with >1% frequency
      recommendations.push({
        action,
        probability: Math.round(probability * 100),
        ev: 0, // Would need separate EV calculation
      });
    }
  }
  
  return recommendations.sort((a, b) => b.probability - a.probability);
}

/**
 * Clear all stored info sets
 */
export function clearInfoSets(): void {
  infoSets.clear();
}

/**
 * Get number of info sets
 */
export function getInfoSetCount(): number {
  return infoSets.size;
}
