/**
 * Equity Calculator Web Worker
 * Runs Monte Carlo simulations in a background thread
 */

import { Card, EquityResult } from '@/lib/poker/types';
import { calculateEquity, calculateEquityVsRange } from '@/lib/poker/equityCalculator';

// Message types
export interface EquityWorkerRequest {
  type: 'calculate' | 'calculateVsRange';
  id: string;
  payload: CalculatePayload | CalculateVsRangePayload;
}

export interface CalculatePayload {
  heroCards: Card[];
  communityCards: Card[];
  numOpponents: number;
  numSimulations: number;
  villainCards?: Card[];
}

export interface CalculateVsRangePayload {
  heroCards: Card[];
  communityCards: Card[];
  villainRange: [string, number][]; // Map entries as array for serialization
  numSimulationsPerHand: number;
}

export interface EquityWorkerResponse {
  type: 'result' | 'error' | 'progress';
  id: string;
  payload: EquityResult | { error: string } | { progress: number };
}

// Handle incoming messages
self.onmessage = (event: MessageEvent<EquityWorkerRequest>) => {
  const { type, id, payload } = event.data;

  try {
    if (type === 'calculate') {
      const { heroCards, communityCards, numOpponents, numSimulations, villainCards } = payload as CalculatePayload;
      
      const result = calculateEquity({
        heroCards,
        communityCards,
        numOpponents,
        numSimulations,
        villainCards,
      });

      const response: EquityWorkerResponse = {
        type: 'result',
        id,
        payload: result,
      };
      
      self.postMessage(response);
    } 
    else if (type === 'calculateVsRange') {
      const { heroCards, communityCards, villainRange, numSimulationsPerHand } = payload as CalculateVsRangePayload;
      
      // Convert array back to Map
      const rangeMap = new Map<string, number>(villainRange);
      
      const result = calculateEquityVsRange(
        heroCards,
        communityCards,
        rangeMap,
        numSimulationsPerHand
      );

      const response: EquityWorkerResponse = {
        type: 'result',
        id,
        payload: result,
      };
      
      self.postMessage(response);
    }
  } catch (error) {
    const response: EquityWorkerResponse = {
      type: 'error',
      id,
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
    
    self.postMessage(response);
  }
};

// Export for TypeScript
export {};
