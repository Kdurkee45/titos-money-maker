/**
 * Table State Parser
 * Combines OCR results into a structured game state
 */

import { Card } from '@/lib/poker/types';
import { CroppedRegion, PokerSiteConfig } from '@/lib/capture/types';
import { 
  TableOCRResult, 
  PlayerOCRResult, 
  CardOCRResult 
} from './types';
import { 
  recognizeStack, 
  recognizePot, 
  recognizePlayerName 
} from './tesseract';
import { recognizeCard, recognizeCardRow } from './cardMatcher';

/**
 * Parse table state from cropped regions
 */
export async function parseTableState(
  regions: CroppedRegion[],
  config: PokerSiteConfig
): Promise<TableOCRResult> {
  console.log('🔬 [StateParser] Starting parse with', regions.length, 'regions');
  
  const result: TableOCRResult = {
    timestamp: Date.now(),
    communityCards: [],
    pot: null,
    players: [],
    currentStreet: 'preflop',
    heroSeat: null,
    dealerSeat: null,
    activeSeat: null,
    confidence: 0,
  };

  // Find and process each region
  const regionMap = new Map<string, CroppedRegion>();
  for (const region of regions) {
    regionMap.set(region.label, region);
  }
  
  console.log('📍 [StateParser] Region labels:', Array.from(regionMap.keys()));

  // Parse community cards
  const communityCardsRegion = regionMap.get('communityCards');
  if (communityCardsRegion) {
    console.log('🃏 [StateParser] Processing community cards region:', {
      width: communityCardsRegion.imageData.width,
      height: communityCardsRegion.imageData.height,
    });
    
    result.communityCards = recognizeCardRow(
      communityCardsRegion.imageData,
      5,
      config.cardRecognition.cardWidth,
      config.cardRecognition.cardGap
    );
    
    console.log('🃏 [StateParser] Community cards result:', result.communityCards);
    
    // Determine street based on visible cards
    const visibleCards = result.communityCards.filter(c => c.card !== null && !c.isHidden);
    if (visibleCards.length === 0) {
      result.currentStreet = 'preflop';
    } else if (visibleCards.length <= 3) {
      result.currentStreet = 'flop';
    } else if (visibleCards.length === 4) {
      result.currentStreet = 'turn';
    } else {
      result.currentStreet = 'river';
    }
    console.log('🎯 [StateParser] Detected street:', result.currentStreet);
  } else {
    console.warn('⚠️ [StateParser] No communityCards region found');
  }

  // Parse pot
  const potRegion = regionMap.get('pot');
  if (potRegion) {
    console.log('💰 [StateParser] Processing pot region...');
    result.pot = await recognizePot(potRegion.imageData);
    console.log('💰 [StateParser] Pot detected:', result.pot);
  } else {
    console.warn('⚠️ [StateParser] No pot region found');
  }

  // Parse each player
  for (let seat = 1; seat <= 9; seat++) {
    const playerResult = await parsePlayerRegion(regionMap, seat, config);
    if (playerResult) {
      result.players.push(playerResult);
      
      // Check if this is the hero (has visible cards)
      if (playerResult.cards.some(c => c.card !== null && !c.isHidden)) {
        result.heroSeat = seat;
      }
      
      // Check if dealer
      if (playerResult.isDealer) {
        result.dealerSeat = seat;
      }
      
      // Check if active
      if (playerResult.isActive) {
        result.activeSeat = seat;
      }
    }
  }

  // Calculate overall confidence
  let totalConfidence = 0;
  let confidenceCount = 0;

  if (result.pot !== null) {
    totalConfidence += 1;
    confidenceCount++;
  }

  for (const card of result.communityCards) {
    totalConfidence += card.confidence;
    confidenceCount++;
  }

  for (const player of result.players) {
    if (player.name) {
      totalConfidence += 1;
      confidenceCount++;
    }
    if (player.stack !== null) {
      totalConfidence += 1;
      confidenceCount++;
    }
  }

  result.confidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

  return result;
}

/**
 * Parse a single player's region
 */
async function parsePlayerRegion(
  regionMap: Map<string, CroppedRegion>,
  seatNumber: number,
  config: PokerSiteConfig
): Promise<PlayerOCRResult | null> {
  const playerRegion = regionMap.get(`player_${seatNumber}`);
  if (!playerRegion) return null;

  const result: PlayerOCRResult = {
    seatNumber,
    name: null,
    stack: null,
    currentBet: null,
    cards: [],
    isActive: false,
    isFolded: false,
    isDealer: false,
    lastAction: null,
  };

  // Parse name
  const nameRegion = regionMap.get(`player_${seatNumber}_name`);
  if (nameRegion) {
    result.name = await recognizePlayerName(nameRegion.imageData);
  }

  // Parse stack
  const stackRegion = regionMap.get(`player_${seatNumber}_stack`);
  if (stackRegion) {
    result.stack = await recognizeStack(stackRegion.imageData);
  }

  // Parse bet
  const betRegion = regionMap.get(`player_${seatNumber}_bet`);
  if (betRegion) {
    result.currentBet = await recognizeStack(betRegion.imageData);
  }

  // Parse cards (for hero)
  const cardsRegion = regionMap.get(`player_${seatNumber}_cards`);
  if (cardsRegion) {
    result.cards = recognizeCardRow(
      cardsRegion.imageData,
      2,
      config.cardRecognition.cardWidth,
      config.cardRecognition.cardGap
    );
  }

  // Detect if folded (usually grayed out or no cards visible)
  result.isFolded = result.cards.length === 0 || 
    result.cards.every(c => c.card === null && !c.isHidden);

  return result;
}

/**
 * Convert TableOCRResult to the game state format used by the UI
 */
export function ocrResultToGameState(
  ocrResult: TableOCRResult,
  previousState?: TableOCRResult
): {
  communityCards: Card[];
  pot: number;
  players: Array<{
    seatNumber: number;
    name: string;
    stack: number;
    currentBet: number;
    holeCards: Card[] | null;
    isFolded: boolean;
    isDealer: boolean;
    isActive: boolean;
  }>;
  street: 'preflop' | 'flop' | 'turn' | 'river';
  dealerSeat: number | null;
  activeSeat: number | null;
  heroSeat: number | null;
} {
  // Extract community cards (only those successfully recognized)
  const communityCards: Card[] = ocrResult.communityCards
    .filter(c => c.card !== null)
    .map(c => c.card!);

  // Build player list
  const players = ocrResult.players.map(p => ({
    seatNumber: p.seatNumber,
    name: p.name || `Seat ${p.seatNumber}`,
    stack: p.stack || 0,
    currentBet: p.currentBet || 0,
    holeCards: p.cards
      .filter(c => c.card !== null && !c.isHidden)
      .map(c => c.card!) as Card[] | null,
    isFolded: p.isFolded,
    isDealer: p.isDealer,
    isActive: p.isActive,
  }));

  return {
    communityCards,
    pot: ocrResult.pot || 0,
    players,
    street: ocrResult.currentStreet,
    dealerSeat: ocrResult.dealerSeat,
    activeSeat: ocrResult.activeSeat,
    heroSeat: ocrResult.heroSeat,
  };
}

/**
 * Detect changes between two OCR results
 */
export function detectChanges(
  current: TableOCRResult,
  previous: TableOCRResult
): {
  newCards: boolean;
  potChanged: boolean;
  playerActed: number | null;
  newStreet: boolean;
} {
  const newCards = current.communityCards.length !== previous.communityCards.length ||
    current.communityCards.some((c, i) => {
      const prev = previous.communityCards[i];
      return !prev || c.card?.rank !== prev.card?.rank || c.card?.suit !== prev.card?.suit;
    });

  const potChanged = current.pot !== previous.pot;

  let playerActed: number | null = null;
  for (const currentPlayer of current.players) {
    const prevPlayer = previous.players.find(p => p.seatNumber === currentPlayer.seatNumber);
    if (prevPlayer) {
      if (currentPlayer.currentBet !== prevPlayer.currentBet ||
          currentPlayer.isFolded !== prevPlayer.isFolded) {
        playerActed = currentPlayer.seatNumber;
        break;
      }
    }
  }

  const newStreet = current.currentStreet !== previous.currentStreet;

  return { newCards, potChanged, playerActed, newStreet };
}
