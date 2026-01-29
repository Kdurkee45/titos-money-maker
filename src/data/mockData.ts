import type { 
  GameState, 
  Player, 
  PlayerStats, 
  PlayerPersona,
  Card,
  HandStrength,
  BoardTexture,
  DrawInfo,
  GTORecommendation,
  EquityResult,
  PotOdds,
  HandHistoryEntry
} from '@/types/poker';

// Helper to create player stats
const createStats = (overrides: Partial<PlayerStats> = {}): PlayerStats => ({
  handsPlayed: 500,
  handsWon: 125,
  winRate: 8.5,
  vpip: 24,
  pfr: 18,
  threeBet: 7,
  foldToThreeBet: 55,
  aggression: 2.1,
  cbet: 68,
  foldToCbet: 45,
  wtsd: 28,
  wsd: 52,
  avgBetSize: 2.5,
  avgRaiseSize: 3.2,
  bluffFrequency: 35,
  positionStats: {
    early: { vpip: 14, pfr: 12 },
    middle: { vpip: 20, pfr: 16 },
    late: { vpip: 32, pfr: 24 },
    blinds: { vpip: 28, pfr: 10 },
  },
  sessionProfit: 245,
  sessionHands: 89,
  biggestPot: 450,
  ...overrides,
});

// Mock players
export const mockPlayers: Player[] = [
  {
    id: 'hero',
    name: 'You',
    stack: 1250,
    position: 'CO',
    isHero: true,
    isActive: true,
    isFolded: false,
    isAllIn: false,
    currentBet: 0,
    holeCards: [
      { rank: 'A', suit: 'spades' },
      { rank: 'K', suit: 'spades' },
    ],
    persona: {
      type: 'shark',
      confidence: 100,
      traits: ['Balanced', 'Positional', 'Aggressive'],
    },
    stats: createStats({
      handsPlayed: 10000,
      winRate: 12.5,
      vpip: 22,
      pfr: 18,
      sessionProfit: 580,
    }),
  },
  {
    id: 'player-1',
    name: 'Mike_Blaster',
    stack: 890,
    position: 'BTN',
    isHero: false,
    isActive: false,
    isFolded: false,
    isAllIn: false,
    currentBet: 0,
    holeCards: null,
    persona: {
      type: 'aggressive',
      confidence: 85,
      traits: ['LAG', 'High 3-Bet', 'Frequent Bluffer'],
    },
    stats: createStats({
      vpip: 38,
      pfr: 32,
      threeBet: 14,
      aggression: 3.8,
      bluffFrequency: 55,
    }),
    colorLabel: '#ef4444',
  },
  {
    id: 'player-2',
    name: 'SB',
    stack: 420,
    position: 'SB',
    isHero: false,
    isActive: false,
    isFolded: true,
    isAllIn: false,
    currentBet: 5,
    holeCards: null,
    persona: {
      type: 'tight',
      confidence: 72,
      traits: ['Nit', 'Only Premium Hands', 'Passive'],
    },
    stats: createStats({
      vpip: 12,
      pfr: 8,
      threeBet: 3,
      aggression: 1.2,
      wtsd: 22,
    }),
    colorLabel: '#6b7280',
  },
  {
    id: 'player-3',
    name: 'BigStack_Dan',
    stack: 2340,
    position: 'BB',
    isHero: false,
    isActive: true,
    isFolded: false,
    isAllIn: false,
    currentBet: 45,
    holeCards: null,
    persona: {
      type: 'conservative',
      confidence: 68,
      traits: ['TAG', 'Solid Postflop', 'Respects Raises'],
    },
    stats: createStats({
      vpip: 21,
      pfr: 17,
      threeBet: 6,
      aggression: 2.0,
      cbet: 72,
    }),
    colorLabel: '#3b82f6',
    lastAction: {
      type: 'raise',
      amount: 45,
      timestamp: Date.now() - 5000,
    },
  },
  {
    id: 'player-4',
    name: 'LuckyFish77',
    stack: 680,
    position: 'UTG',
    isHero: false,
    isActive: false,
    isFolded: true,
    isAllIn: false,
    currentBet: 0,
    holeCards: null,
    persona: {
      type: 'loose',
      confidence: 90,
      traits: ['Calling Station', 'Chases Draws', 'Passive'],
    },
    stats: createStats({
      vpip: 48,
      pfr: 8,
      foldToCbet: 25,
      wtsd: 42,
      wsd: 38,
    }),
    colorLabel: '#f59e0b',
    notes: 'Will call any bet with any draw. Never folds top pair.',
  },
  {
    id: 'player-5',
    name: 'PokerPro_X',
    stack: 1560,
    position: 'UTG+1',
    isHero: false,
    isActive: false,
    isFolded: true,
    isAllIn: false,
    currentBet: 0,
    holeCards: null,
    persona: {
      type: 'shark',
      confidence: 78,
      traits: ['GTO Player', 'Balanced', 'Tricky'],
    },
    stats: createStats({
      handsPlayed: 25000,
      winRate: 10.2,
      vpip: 23,
      pfr: 20,
      threeBet: 9,
    }),
    colorLabel: '#14b8a6',
    notes: 'Very skilled. Avoid marginal spots.',
  },
  {
    id: 'player-6',
    name: 'Bluff_Master',
    stack: 1120,
    position: 'MP',
    isHero: false,
    isActive: false,
    isFolded: false,
    isAllIn: false,
    currentBet: 15,
    holeCards: null,
    persona: {
      type: 'bluffer',
      confidence: 82,
      traits: ['Overbluffs Rivers', 'Light 3-Bets', 'Creative Lines'],
    },
    stats: createStats({
      vpip: 32,
      pfr: 26,
      threeBet: 12,
      bluffFrequency: 65,
      cbet: 85,
    }),
    colorLabel: '#a855f7',
    lastAction: {
      type: 'call',
      amount: 15,
      timestamp: Date.now() - 8000,
    },
  },
  {
    id: 'player-7',
    name: 'NewPlayer_123',
    stack: 500,
    position: 'HJ',
    isHero: false,
    isActive: false,
    isFolded: true,
    isAllIn: false,
    currentBet: 0,
    holeCards: null,
    persona: {
      type: 'unknown',
      confidence: 25,
      traits: ['New to Table', 'Insufficient Data'],
    },
    stats: createStats({
      handsPlayed: 12,
    }),
  },
];

// Mock game state
export const mockGameState: GameState = {
  tableId: 'table-001',
  tableName: 'High Stakes Hold\'em #1',
  gameType: 'cash',
  stakes: '$5/$10 NL',
  smallBlind: 5,
  bigBlind: 10,
  ante: 0,
  handNumber: 1247,
  street: 'flop',
  pot: 125,
  sidePots: [],
  communityCards: [
    { rank: 'K', suit: 'hearts' },
    { rank: '7', suit: 'spades' },
    { rank: '2', suit: 'clubs' },
  ],
  players: mockPlayers,
  heroId: 'hero',
  dealerPosition: 1,
  activePlayerId: 'hero',
  currentBet: 45,
  minRaise: 90,
  timeBank: 30,
  actionTimer: 15,
};

// Mock hand strength for hero
export const mockHandStrength: HandStrength = {
  ranking: 'pair',
  rankingName: 'Top Pair, Top Kicker',
  kickers: ['A'],
  percentile: 82,
  description: 'You have top pair (Kings) with the best possible kicker (Ace).',
};

// Mock board texture
export const mockBoardTexture: BoardTexture = {
  isPaired: false,
  isMonotone: false,
  isTwoTone: false,
  isRainbow: true,
  isConnected: false,
  hasFlushDraw: false,
  hasStraightDraw: false,
  highCard: 'K',
  texture: 'dry',
  dangerLevel: 'low',
};

// Mock draws
export const mockDraws: DrawInfo[] = [
  {
    type: 'flush',
    outs: 9,
    probability: 35,
    cards: [
      { rank: 'Q', suit: 'spades' },
      { rank: 'J', suit: 'spades' },
      { rank: 'T', suit: 'spades' },
    ],
  },
];

// Mock equity
export const mockEquity: EquityResult = {
  win: 72.4,
  tie: 1.2,
  lose: 26.4,
  samples: 10000,
};

// Mock pot odds
export const mockPotOdds: PotOdds = {
  potSize: 125,
  toCall: 45,
  odds: 26.5,
  impliedOdds: 35,
  requiredEquity: 26.5,
  isGoodCall: true,
};

// Mock GTO recommendation
export const mockGTORecommendation: GTORecommendation = {
  situation: 'Facing 3-bet with top pair, dry board',
  actions: [
    { action: 'raise', frequency: 55, ev: 12.4, sizing: 125, isPrimary: true },
    { action: 'call', frequency: 40, ev: 8.2, isPrimary: false },
    { action: 'fold', frequency: 5, ev: 0, isPrimary: false },
  ],
  explanation: 'With TPTK on a dry board, you have significant equity against villain\'s range. A raise is optimal to build the pot and deny equity from draws.',
  exploitativeAdjustment: 'Against BigStack_Dan (TAG), lean towards calling more as he typically has a strong range here. Against a LAG, size up your raise.',
};

// Mock hand history
export const mockHandHistory: HandHistoryEntry[] = [
  {
    handNumber: 1246,
    timestamp: Date.now() - 120000,
    players: ['You', 'Mike_Blaster', 'BigStack_Dan'],
    heroCards: [{ rank: 'Q', suit: 'hearts' }, { rank: 'Q', suit: 'diamonds' }],
    communityCards: [
      { rank: 'Q', suit: 'spades' },
      { rank: '8', suit: 'clubs' },
      { rank: '3', suit: 'hearts' },
      { rank: 'J', suit: 'diamonds' },
      { rank: '5', suit: 'spades' },
    ],
    pot: 340,
    result: 'won',
    profit: 185,
    showdown: true,
    actions: [
      { street: 'preflop', player: 'You', action: 'raise', amount: 30 },
      { street: 'preflop', player: 'Mike_Blaster', action: 'call', amount: 30 },
      { street: 'flop', player: 'You', action: 'bet', amount: 45 },
      { street: 'flop', player: 'Mike_Blaster', action: 'call', amount: 45 },
      { street: 'turn', player: 'You', action: 'bet', amount: 80 },
      { street: 'turn', player: 'Mike_Blaster', action: 'fold' },
    ],
  },
  {
    handNumber: 1245,
    timestamp: Date.now() - 240000,
    players: ['You', 'LuckyFish77', 'PokerPro_X'],
    heroCards: [{ rank: 'A', suit: 'clubs' }, { rank: 'K', suit: 'diamonds' }],
    communityCards: [
      { rank: '9', suit: 'hearts' },
      { rank: '8', suit: 'clubs' },
      { rank: '2', suit: 'spades' },
      { rank: 'K', suit: 'clubs' },
      { rank: '4', suit: 'hearts' },
    ],
    pot: 220,
    result: 'won',
    profit: 110,
    showdown: false,
    actions: [
      { street: 'preflop', player: 'You', action: 'raise', amount: 25 },
      { street: 'preflop', player: 'LuckyFish77', action: 'call', amount: 25 },
      { street: 'flop', player: 'You', action: 'check' },
      { street: 'flop', player: 'LuckyFish77', action: 'bet', amount: 35 },
      { street: 'flop', player: 'You', action: 'call', amount: 35 },
      { street: 'turn', player: 'You', action: 'bet', amount: 70 },
      { street: 'turn', player: 'LuckyFish77', action: 'fold' },
    ],
  },
  {
    handNumber: 1244,
    timestamp: Date.now() - 360000,
    players: ['You', 'Bluff_Master'],
    heroCards: [{ rank: '8', suit: 'hearts' }, { rank: '8', suit: 'clubs' }],
    communityCards: [
      { rank: 'A', suit: 'spades' },
      { rank: 'K', suit: 'hearts' },
      { rank: 'J', suit: 'diamonds' },
      { rank: '6', suit: 'clubs' },
      { rank: '2', suit: 'hearts' },
    ],
    pot: 180,
    result: 'lost',
    profit: -90,
    showdown: false,
    actions: [
      { street: 'preflop', player: 'Bluff_Master', action: 'raise', amount: 30 },
      { street: 'preflop', player: 'You', action: 'call', amount: 30 },
      { street: 'flop', player: 'Bluff_Master', action: 'bet', amount: 40 },
      { street: 'flop', player: 'You', action: 'call', amount: 40 },
      { street: 'turn', player: 'Bluff_Master', action: 'bet', amount: 85 },
      { street: 'turn', player: 'You', action: 'fold' },
    ],
  },
];

// Possible hands for opponent range visualization
export const HAND_MATRIX = [
  ['AA', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s'],
  ['AKo', 'KK', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s'],
  ['AQo', 'KQo', 'QQ', 'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s'],
  ['AJo', 'KJo', 'QJo', 'JJ', 'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s'],
  ['ATo', 'KTo', 'QTo', 'JTo', 'TT', 'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s'],
  ['A9o', 'K9o', 'Q9o', 'J9o', 'T9o', '99', '98s', '97s', '96s', '95s', '94s', '93s', '92s'],
  ['A8o', 'K8o', 'Q8o', 'J8o', 'T8o', '98o', '88', '87s', '86s', '85s', '84s', '83s', '82s'],
  ['A7o', 'K7o', 'Q7o', 'J7o', 'T7o', '97o', '87o', '77', '76s', '75s', '74s', '73s', '72s'],
  ['A6o', 'K6o', 'Q6o', 'J6o', 'T6o', '96o', '86o', '76o', '66', '65s', '64s', '63s', '62s'],
  ['A5o', 'K5o', 'Q5o', 'J5o', 'T5o', '95o', '85o', '75o', '65o', '55', '54s', '53s', '52s'],
  ['A4o', 'K4o', 'Q4o', 'J4o', 'T4o', '94o', '84o', '74o', '64o', '54o', '44', '43s', '42s'],
  ['A3o', 'K3o', 'Q3o', 'J3o', 'T3o', '93o', '83o', '73o', '63o', '53o', '43o', '33', '32s'],
  ['A2o', 'K2o', 'Q2o', 'J2o', 'T2o', '92o', '82o', '72o', '62o', '52o', '42o', '32o', '22'],
];

// Example opponent range (for BigStack_Dan's 3-bet range)
export const mockOpponentRange: Record<string, number> = {
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 0.5,
  'AKs': 1, 'AKo': 1, 'AQs': 1, 'AQo': 0.5, 'AJs': 0.5,
  'KQs': 0.5,
};
