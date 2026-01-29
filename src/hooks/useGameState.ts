/**
 * Hook for managing game state and running analysis
 */

import { useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useEquityCalculator } from './useEquityCalculator';
import { 
  evaluateHand, 
  getHandPercentile,
  analyzeBoardTexture,
  findDraws,
} from '@/lib/poker';
import { 
  getOpeningRange, 
  isHandInRange,
} from '@/lib/solver/precomputedRanges';
import type { Card } from '@/lib/poker/types';

export function useGameState() {
  const store = useGameStore();
  const { equity, calculate, calculateVsRange, isCalculating } = useEquityCalculator({
    numSimulations: 5000,
  });

  // Get hero's cards
  const heroPlayer = store.players.find(p => p.isHero);
  const heroCards = heroPlayer?.holeCards || null;
  const communityCards = store.hand.communityCards;

  // Run analysis when cards change
  useEffect(() => {
    if (!heroCards || heroCards.length < 2) return;

    // Evaluate hand strength
    if (communityCards.length >= 3) {
      const allCards = [...heroCards, ...communityCards];
      const evaluated = evaluateHand(allCards);
      const percentile = getHandPercentile(evaluated);

      store.setHandStrength({
        ranking: evaluated.ranking,
        rankingName: evaluated.description,
        percentile,
        description: `You have ${evaluated.description}`,
      });

      // Analyze board texture
      const texture = analyzeBoardTexture(communityCards);
      store.setBoardTexture(texture);

      // Find draws
      const draws = findDraws(heroCards, communityCards);
      store.setDraws(draws);
    }

    // Calculate equity
    const activeOpponents = store.players.filter(
      p => !p.isHero && !p.isFolded
    ).length;

    if (activeOpponents > 0) {
      calculate(heroCards, communityCards, activeOpponents);
    }
  }, [heroCards, communityCards, store.players]);

  // Update equity in store when calculated
  useEffect(() => {
    if (equity) {
      store.setEquity(equity);

      // Calculate pot odds
      const pot = store.hand.pot;
      const toCall = store.hand.currentBet;
      
      if (toCall > 0) {
        const potOdds = (toCall / (pot + toCall)) * 100;
        const requiredEquity = potOdds;
        const isGoodCall = equity.win > requiredEquity;

        store.setPotOdds({
          potSize: pot,
          toCall,
          odds: potOdds,
          requiredEquity,
          isGoodCall,
        });
      }
    }
  }, [equity, store.hand.pot, store.hand.currentBet]);

  // Get GTO recommendation
  const getRecommendation = useCallback(() => {
    if (!heroCards || heroCards.length < 2 || !heroPlayer) return null;

    const position = heroPlayer.position;
    const street = store.hand.street;

    // Pre-flop recommendations based on precomputed ranges
    if (street === 'preflop') {
      const handNotation = getHandNotation(heroCards);
      
      // Check if we should open
      const openRange = getOpeningRange(position);
      if (openRange) {
        const { inRange, frequency } = isHandInRange(handNotation, openRange);
        
        if (inRange) {
          return {
            actions: [
              { action: 'raise' as const, frequency: frequency * 100, ev: 0.5 },
              { action: 'fold' as const, frequency: (1 - frequency) * 100, ev: 0 },
            ],
            explanation: `${handNotation} is in your opening range from ${position}. Raise ${(frequency * 100).toFixed(0)}% of the time.`,
          };
        } else {
          return {
            actions: [
              { action: 'fold' as const, frequency: 100, ev: 0 },
            ],
            explanation: `${handNotation} is not in your opening range from ${position}. Consider folding.`,
          };
        }
      }
    }

    return null;
  }, [heroCards, heroPlayer, store.hand.street]);

  // Apply OCR result to game state
  const applyOCRResult = useCallback((ocrResult: Parameters<typeof store.setOCRResult>[0]) => {
    store.setOCRResult(ocrResult);

    // Update community cards
    const cards = ocrResult.communityCards
      .filter(c => c.card !== null)
      .map(c => c.card!);
    store.setCommunityCards(cards);

    // Update pot
    if (ocrResult.pot !== null) {
      store.setHandState({ pot: ocrResult.pot });
    }

    // Update street
    store.setHandState({ street: ocrResult.currentStreet });

    // Update players
    const playerStates = ocrResult.players.map(p => ({
      id: `player-${p.seatNumber}`,
      seatNumber: p.seatNumber,
      name: p.name || `Seat ${p.seatNumber}`,
      stack: p.stack || 0,
      position: getPositionFromSeat(p.seatNumber, ocrResult.dealerSeat || 0, ocrResult.players.length),
      isHero: p.seatNumber === ocrResult.heroSeat,
      isActive: p.seatNumber === ocrResult.activeSeat,
      isFolded: p.isFolded,
      isAllIn: false,
      currentBet: p.currentBet || 0,
      holeCards: p.cards
        .filter(c => c.card !== null && !c.isHidden)
        .map(c => c.card!) as Card[],
      persona: 'unknown',
    }));

    store.setPlayers(playerStates);
  }, [store]);

  return {
    // State
    players: store.players,
    hand: store.hand,
    analysis: store.analysis,
    capture: store.capture,
    ui: store.ui,
    
    // Computed
    heroCards,
    communityCards,
    isCalculating,
    
    // Actions
    getRecommendation,
    applyOCRResult,
    selectPlayer: store.selectPlayer,
    setActiveTab: store.setActiveTab,
    addAlert: store.addAlert,
    dismissAlert: store.dismissAlert,
    resetHand: store.resetHand,
  };
}

/**
 * Convert hole cards to hand notation
 */
function getHandNotation(cards: Card[]): string {
  if (cards.length !== 2) return '';
  
  const [c1, c2] = cards;
  const rankOrder = 'AKQJT98765432';
  
  // Order by rank (higher first)
  const [high, low] = rankOrder.indexOf(c1.rank) <= rankOrder.indexOf(c2.rank)
    ? [c1, c2]
    : [c2, c1];
  
  if (high.rank === low.rank) {
    return `${high.rank}${low.rank}`;
  }
  
  const suited = high.suit === low.suit;
  return `${high.rank}${low.rank}${suited ? 's' : 'o'}`;
}

/**
 * Get position from seat number relative to dealer
 */
function getPositionFromSeat(
  seat: number, 
  dealerSeat: number, 
  totalPlayers: number
): string {
  const positions = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO'];
  const offset = (seat - dealerSeat + totalPlayers) % totalPlayers;
  return positions[offset] || 'UTG';
}
