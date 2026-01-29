import { create } from 'zustand';
import type { Card, EquityResult, BoardTexture, DrawInfo } from '@/lib/poker/types';
import type { TableOCRResult } from '@/lib/ocr/types';
import type { SpotRecommendation } from '@/lib/solver/types';

// Player state for the current hand
interface PlayerState {
  id: string;
  seatNumber: number;
  name: string;
  stack: number;
  position: string;
  isHero: boolean;
  isActive: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  currentBet: number;
  holeCards: Card[] | null;
  persona: string;
  notes?: string;
  colorLabel?: string;
}

// Current hand state
interface HandState {
  street: 'preflop' | 'flop' | 'turn' | 'river';
  pot: number;
  communityCards: Card[];
  currentBet: number;
  minRaise: number;
  dealerSeat: number;
  activeSeat: number | null;
  heroSeat: number | null;
}

// Analysis results
interface AnalysisState {
  equity: EquityResult | null;
  potOdds: {
    potSize: number;
    toCall: number;
    odds: number;
    requiredEquity: number;
    isGoodCall: boolean;
  } | null;
  handStrength: {
    ranking: string;
    rankingName: string;
    percentile: number;
    description: string;
  } | null;
  boardTexture: BoardTexture | null;
  draws: DrawInfo[];
  recommendation: SpotRecommendation | null;
}

// Session state
interface SessionState {
  sessionId: string | null;
  isActive: boolean;
  handsPlayed: number;
  profit: number;
}

// Extracted region preview
interface RegionPreview {
  label: string;
  dataUrl: string;
  width: number;
  height: number;
}

// Capture state
interface CaptureState {
  isCapturing: boolean;
  lastOCRResult: TableOCRResult | null;
  lastFrameDataUrl: string | null;
  regionPreviews: RegionPreview[];
  fps: number;
  errors: string[];
}

// UI state
interface UIState {
  selectedPlayerId: string | null;
  activeTab: 'analysis' | 'ranges' | 'history';
  showSettings: boolean;
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'danger' | 'success';
    title: string;
    message: string;
    dismissed: boolean;
  }>;
}

// Combined store state
interface GameStore {
  // State
  players: PlayerState[];
  hand: HandState;
  analysis: AnalysisState;
  session: SessionState;
  capture: CaptureState;
  ui: UIState;
  
  // Player actions
  setPlayers: (players: PlayerState[]) => void;
  updatePlayer: (seatNumber: number, updates: Partial<PlayerState>) => void;
  
  // Hand actions
  setHandState: (hand: Partial<HandState>) => void;
  setCommunityCards: (cards: Card[]) => void;
  advanceStreet: () => void;
  resetHand: () => void;
  
  // Analysis actions
  setEquity: (equity: EquityResult) => void;
  setPotOdds: (potOdds: AnalysisState['potOdds']) => void;
  setHandStrength: (strength: AnalysisState['handStrength']) => void;
  setBoardTexture: (texture: BoardTexture) => void;
  setDraws: (draws: DrawInfo[]) => void;
  setRecommendation: (rec: SpotRecommendation) => void;
  
  // Session actions
  startSession: (sessionId: string) => void;
  endSession: () => void;
  recordHand: (profit: number) => void;
  
  // Capture actions
  setCaptureState: (state: Partial<CaptureState>) => void;
  setOCRResult: (result: TableOCRResult) => void;
  
  // UI actions
  selectPlayer: (playerId: string | null) => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
  toggleSettings: () => void;
  addAlert: (alert: Omit<UIState['alerts'][0], 'id' | 'dismissed'>) => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
}

// Initial state
const initialHandState: HandState = {
  street: 'preflop',
  pot: 0,
  communityCards: [],
  currentBet: 0,
  minRaise: 0,
  dealerSeat: 0,
  activeSeat: null,
  heroSeat: null,
};

const initialAnalysisState: AnalysisState = {
  equity: null,
  potOdds: null,
  handStrength: null,
  boardTexture: null,
  draws: [],
  recommendation: null,
};

export const useGameStore = create<GameStore>()((set) => ({
  // Initial state
  players: [],
  hand: initialHandState,
  analysis: initialAnalysisState,
  session: {
    sessionId: null,
    isActive: false,
    handsPlayed: 0,
    profit: 0,
  },
  capture: {
    isCapturing: false,
    lastOCRResult: null,
    lastFrameDataUrl: null,
    regionPreviews: [],
    fps: 0,
    errors: [],
  },
  ui: {
    selectedPlayerId: null,
    activeTab: 'analysis',
    showSettings: false,
    alerts: [],
  },
  
  // Player actions
  setPlayers: (players) => set({ players }),
  
  updatePlayer: (seatNumber, updates) => set((state) => ({
    players: state.players.map((p) =>
      p.seatNumber === seatNumber ? { ...p, ...updates } : p
    ),
  })),
  
  // Hand actions
  setHandState: (hand) => set((state) => ({
    hand: { ...state.hand, ...hand },
  })),
  
  setCommunityCards: (cards) => set((state) => ({
    hand: { ...state.hand, communityCards: cards },
  })),
  
  advanceStreet: () => set((state) => {
    const streetOrder: HandState['street'][] = ['preflop', 'flop', 'turn', 'river'];
    const currentIndex = streetOrder.indexOf(state.hand.street);
    const nextStreet = streetOrder[Math.min(currentIndex + 1, 3)];
    return {
      hand: { ...state.hand, street: nextStreet, currentBet: 0 },
    };
  }),
  
  resetHand: () => set((state) => ({
    hand: initialHandState,
    analysis: initialAnalysisState,
    players: state.players.map((p) => ({
      ...p,
      isFolded: false,
      isAllIn: false,
      currentBet: 0,
      holeCards: p.isHero ? p.holeCards : null,
    })),
  })),
  
  // Analysis actions
  setEquity: (equity) => set((state) => ({
    analysis: { ...state.analysis, equity },
  })),
  
  setPotOdds: (potOdds) => set((state) => ({
    analysis: { ...state.analysis, potOdds },
  })),
  
  setHandStrength: (handStrength) => set((state) => ({
    analysis: { ...state.analysis, handStrength },
  })),
  
  setBoardTexture: (boardTexture) => set((state) => ({
    analysis: { ...state.analysis, boardTexture },
  })),
  
  setDraws: (draws) => set((state) => ({
    analysis: { ...state.analysis, draws },
  })),
  
  setRecommendation: (recommendation) => set((state) => ({
    analysis: { ...state.analysis, recommendation },
  })),
  
  // Session actions
  startSession: (sessionId) => set({
    session: {
      sessionId,
      isActive: true,
      handsPlayed: 0,
      profit: 0,
    },
  }),
  
  endSession: () => set((state) => ({
    session: {
      ...state.session,
      isActive: false,
    },
  })),
  
  recordHand: (profit) => set((state) => ({
    session: {
      ...state.session,
      handsPlayed: state.session.handsPlayed + 1,
      profit: state.session.profit + profit,
    },
  })),
  
  // Capture actions
  setCaptureState: (captureState) => set((state) => ({
    capture: { ...state.capture, ...captureState },
  })),
  
  setOCRResult: (result) => set((state) => ({
    capture: { ...state.capture, lastOCRResult: result },
  })),
  
  // UI actions
  selectPlayer: (selectedPlayerId) => set((state) => ({
    ui: { ...state.ui, selectedPlayerId },
  })),
  
  setActiveTab: (activeTab) => set((state) => ({
    ui: { ...state.ui, activeTab },
  })),
  
  toggleSettings: () => set((state) => ({
    ui: { ...state.ui, showSettings: !state.ui.showSettings },
  })),
  
  addAlert: (alert) => set((state) => ({
    ui: {
      ...state.ui,
      alerts: [
        { ...alert, id: crypto.randomUUID(), dismissed: false },
        ...state.ui.alerts,
      ].slice(0, 10),
    },
  })),
  
  dismissAlert: (id) => set((state) => ({
    ui: {
      ...state.ui,
      alerts: state.ui.alerts.map((a) =>
        a.id === id ? { ...a, dismissed: true } : a
      ),
    },
  })),
  
  clearAlerts: () => set((state) => ({
    ui: { ...state.ui, alerts: [] },
  })),
}));
