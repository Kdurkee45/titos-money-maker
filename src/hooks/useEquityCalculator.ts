/**
 * Hook for using the equity calculator Web Worker
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card, EquityResult } from '@/lib/poker/types';
import type { 
  EquityWorkerRequest, 
  EquityWorkerResponse,
  CalculatePayload,
  CalculateVsRangePayload 
} from '@/workers/equity.worker';

interface UseEquityCalculatorOptions {
  numSimulations?: number;
  autoCalculate?: boolean;
}

interface UseEquityCalculatorReturn {
  equity: EquityResult | null;
  isCalculating: boolean;
  error: string | null;
  calculate: (
    heroCards: Card[],
    communityCards: Card[],
    numOpponents?: number
  ) => void;
  calculateVsRange: (
    heroCards: Card[],
    communityCards: Card[],
    villainRange: Map<string, number>
  ) => void;
}

export function useEquityCalculator(
  options: UseEquityCalculatorOptions = {}
): UseEquityCalculatorReturn {
  const { numSimulations = 10000 } = options;
  
  const [equity, setEquity] = useState<EquityResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  // Initialize worker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Create worker
    workerRef.current = new Worker(
      new URL('../workers/equity.worker.ts', import.meta.url)
    );
    
    // Handle messages from worker
    workerRef.current.onmessage = (event: MessageEvent<EquityWorkerResponse>) => {
      const { type, payload } = event.data;
      
      setIsCalculating(false);
      
      if (type === 'result') {
        setEquity(payload as EquityResult);
        setError(null);
      } else if (type === 'error') {
        setError((payload as { error: string }).error);
        setEquity(null);
      }
    };
    
    workerRef.current.onerror = (err) => {
      setError(err.message);
      setIsCalculating(false);
    };
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const calculate = useCallback((
    heroCards: Card[],
    communityCards: Card[],
    numOpponents: number = 1
  ) => {
    if (!workerRef.current) return;
    
    setIsCalculating(true);
    setError(null);
    
    const id = String(++requestIdRef.current);
    
    const request: EquityWorkerRequest = {
      type: 'calculate',
      id,
      payload: {
        heroCards,
        communityCards,
        numOpponents,
        numSimulations,
      } as CalculatePayload,
    };
    
    workerRef.current.postMessage(request);
  }, [numSimulations]);

  const calculateVsRange = useCallback((
    heroCards: Card[],
    communityCards: Card[],
    villainRange: Map<string, number>
  ) => {
    if (!workerRef.current) return;
    
    setIsCalculating(true);
    setError(null);
    
    const id = String(++requestIdRef.current);
    
    const request: EquityWorkerRequest = {
      type: 'calculateVsRange',
      id,
      payload: {
        heroCards,
        communityCards,
        villainRange: [...villainRange.entries()],
        numSimulationsPerHand: Math.floor(numSimulations / villainRange.size),
      } as CalculateVsRangePayload,
    };
    
    workerRef.current.postMessage(request);
  }, [numSimulations]);

  return {
    equity,
    isCalculating,
    error,
    calculate,
    calculateVsRange,
  };
}
