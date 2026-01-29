/**
 * OCR Types
 */

import { Card, Rank, Suit } from '@/lib/poker/types';

// OCR result for text
export interface TextOCRResult {
  text: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Card recognition result
export interface CardOCRResult {
  card: Card | null;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isHidden: boolean;
}

// Player info extracted from OCR
export interface PlayerOCRResult {
  seatNumber: number;
  name: string | null;
  stack: number | null;
  currentBet: number | null;
  cards: CardOCRResult[];
  isActive: boolean;
  isFolded: boolean;
  isDealer: boolean;
  lastAction: string | null;
}

// Full table OCR result
export interface TableOCRResult {
  timestamp: number;
  communityCards: CardOCRResult[];
  pot: number | null;
  players: PlayerOCRResult[];
  currentStreet: 'preflop' | 'flop' | 'turn' | 'river';
  heroSeat: number | null;
  dealerSeat: number | null;
  activeSeat: number | null;
  confidence: number;
}

// OCR engine status
export interface OCREngineStatus {
  initialized: boolean;
  loading: boolean;
  isReady: boolean;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

// Card template for matching
export interface CardTemplate {
  rank: Rank;
  suit: Suit;
  imageData: ImageData;
  hash?: string; // Perceptual hash for fast matching
}

// Template matching result
export interface TemplateMatchResult {
  rank: Rank | null;
  suit: Suit | null;
  confidence: number;
  matchedTemplate: CardTemplate | null;
}
