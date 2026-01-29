/**
 * Game Tree Builder
 * Constructs the decision tree for poker solving
 */

import { GameNode, SolverAction, PlayerId, SolverConfig, NodeType } from './types';

/**
 * Get available actions at a node
 */
export function getAvailableActions(
  pot: number,
  toCall: number,
  stack: number,
  betSizings: number[],
  canCheck: boolean
): SolverAction[] {
  const actions: SolverAction[] = ['fold'];
  
  if (canCheck) {
    actions.push('check');
  } else if (toCall > 0 && toCall < stack) {
    actions.push('call');
  }
  
  // Add bet/raise sizings
  if (stack > toCall) {
    const remainingStack = stack - toCall;
    const currentPot = pot + toCall;
    
    for (const sizing of betSizings) {
      const betAmount = Math.floor(currentPot * sizing);
      if (betAmount > 0 && betAmount < remainingStack) {
        if (sizing <= 0.4) {
          actions.push('bet_small');
        } else if (sizing <= 0.7) {
          actions.push('bet_medium');
        } else if (sizing <= 1.1) {
          actions.push('bet_pot');
        } else {
          actions.push('bet_large');
        }
      }
    }
    
    // All-in is always an option
    actions.push('bet_allin');
  }
  
  // Remove duplicates
  return [...new Set(actions)];
}

/**
 * Calculate bet amount for an action
 */
export function getBetAmount(
  action: SolverAction,
  pot: number,
  toCall: number,
  stack: number
): number {
  const remainingStack = stack - toCall;
  const currentPot = pot + toCall;
  
  switch (action) {
    case 'fold':
    case 'check':
      return 0;
    case 'call':
      return toCall;
    case 'bet_small':
      return Math.min(Math.floor(currentPot * 0.33), remainingStack);
    case 'bet_medium':
      return Math.min(Math.floor(currentPot * 0.5), remainingStack);
    case 'bet_pot':
      return Math.min(currentPot, remainingStack);
    case 'bet_large':
      return Math.min(Math.floor(currentPot * 1.5), remainingStack);
    case 'bet_allin':
      return remainingStack;
    default:
      return 0;
  }
}

/**
 * Build a simplified game tree
 * This is a simplified version for demonstration - a full solver would be more complex
 */
export function buildGameTree(config: SolverConfig): GameNode {
  const { stackSize, potSize, betSizings, maxRaisesPerStreet } = config;
  
  // Determine starting street based on board
  let startStreet: 'preflop' | 'flop' | 'turn' | 'river';
  if (config.board.length === 0) startStreet = 'preflop';
  else if (config.board.length === 3) startStreet = 'flop';
  else if (config.board.length === 4) startStreet = 'turn';
  else startStreet = 'river';
  
  // Build root node (OOP acts first post-flop)
  const root = buildNode(
    0 as PlayerId, // OOP acts first
    potSize,
    [stackSize, stackSize],
    [0, 0],
    0, // raise count
    startStreet,
    betSizings,
    maxRaisesPerStreet
  );
  
  return root;
}

/**
 * Recursively build a game tree node
 */
function buildNode(
  player: PlayerId,
  pot: number,
  stacks: [number, number],
  bets: [number, number],
  raiseCount: number,
  street: 'preflop' | 'flop' | 'turn' | 'river',
  betSizings: number[],
  maxRaises: number,
  depth: number = 0
): GameNode {
  // Limit tree depth for performance
  const MAX_DEPTH = 10;
  if (depth > MAX_DEPTH) {
    return createTerminalNode(pot, stacks, bets, street);
  }
  
  const toCall = Math.abs(bets[0] - bets[1]);
  const canCheck = toCall === 0;
  const activeStack = stacks[player];
  
  // Check for all-in situations
  if (activeStack <= toCall) {
    // Force all-in or fold
    return createTerminalNode(pot + bets[0] + bets[1], stacks, bets, street);
  }
  
  const actions = getAvailableActions(
    pot,
    player === 0 ? toCall : toCall,
    activeStack,
    raiseCount < maxRaises ? betSizings : [],
    canCheck
  );
  
  const node: GameNode = {
    type: 'player',
    player,
    actions,
    children: new Map(),
    pot,
    stacks,
    street,
    bets,
    isTerminal: false,
  };
  
  // Build children for each action
  for (const action of actions) {
    const child = buildChildNode(
      node,
      action,
      player,
      pot,
      stacks,
      bets,
      raiseCount,
      street,
      betSizings,
      maxRaises,
      depth
    );
    node.children.set(action, child);
  }
  
  return node;
}

/**
 * Build a child node for an action
 */
function buildChildNode(
  parent: GameNode,
  action: SolverAction,
  player: PlayerId,
  pot: number,
  stacks: [number, number],
  bets: [number, number],
  raiseCount: number,
  street: 'preflop' | 'flop' | 'turn' | 'river',
  betSizings: number[],
  maxRaises: number,
  depth: number
): GameNode {
  const opponent = (1 - player) as PlayerId;
  const toCall = Math.abs(bets[0] - bets[1]);
  
  switch (action) {
    case 'fold':
      // Terminal - opponent wins
      return createTerminalNode(pot + bets[0] + bets[1], stacks, bets, street, opponent);
    
    case 'check':
      if (bets[0] === bets[1] && player === 1) {
        // Both checked, go to next street or showdown
        const nextStreet = getNextStreet(street);
        if (nextStreet) {
          return buildNode(
            0, // OOP acts first on new street
            pot + bets[0] + bets[1],
            stacks,
            [0, 0],
            0,
            nextStreet,
            betSizings,
            maxRaises,
            depth + 1
          );
        } else {
          // Showdown
          return createTerminalNode(pot + bets[0] + bets[1], stacks, [0, 0], street);
        }
      } else {
        // Opponent's turn
        return buildNode(
          opponent,
          pot,
          stacks,
          bets,
          raiseCount,
          street,
          betSizings,
          maxRaises,
          depth + 1
        );
      }
    
    case 'call':
      // Match the bet
      const newStacks: [number, number] = [...stacks] as [number, number];
      newStacks[player] -= toCall;
      const newBets: [number, number] = [...bets] as [number, number];
      newBets[player] += toCall;
      
      // Go to next street or showdown
      const nextStreet = getNextStreet(street);
      if (nextStreet) {
        return buildNode(
          0,
          pot + newBets[0] + newBets[1],
          newStacks,
          [0, 0],
          0,
          nextStreet,
          betSizings,
          maxRaises,
          depth + 1
        );
      } else {
        return createTerminalNode(pot + newBets[0] + newBets[1], newStacks, [0, 0], street);
      }
    
    default:
      // Bet/raise
      const betAmount = getBetAmount(action, pot + bets[0] + bets[1], toCall, stacks[player]);
      const totalPut = toCall + betAmount;
      
      const betStacks: [number, number] = [...stacks] as [number, number];
      betStacks[player] -= totalPut;
      const betBets: [number, number] = [...bets] as [number, number];
      betBets[player] += totalPut;
      
      return buildNode(
        opponent,
        pot,
        betStacks,
        betBets,
        raiseCount + 1,
        street,
        betSizings,
        maxRaises,
        depth + 1
      );
  }
}

/**
 * Create a terminal node
 */
function createTerminalNode(
  pot: number,
  stacks: [number, number],
  bets: [number, number],
  street: 'preflop' | 'flop' | 'turn' | 'river',
  winner?: PlayerId
): GameNode {
  return {
    type: 'terminal',
    player: null,
    actions: [],
    children: new Map(),
    pot,
    stacks,
    street,
    bets,
    isTerminal: true,
    terminalValue: winner !== undefined ? (winner === 0 ? pot : -pot) : 0,
  };
}

/**
 * Get the next street
 */
function getNextStreet(
  street: 'preflop' | 'flop' | 'turn' | 'river'
): 'flop' | 'turn' | 'river' | null {
  switch (street) {
    case 'preflop': return 'flop';
    case 'flop': return 'turn';
    case 'turn': return 'river';
    case 'river': return null;
  }
}
