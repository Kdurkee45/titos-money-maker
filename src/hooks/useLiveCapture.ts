'use client';

/**
 * Live Capture Hook
 * Orchestrates screen capture, OCR processing, and state updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useScreenCapture } from './useScreenCapture';
import { useGameStore } from '@/store/gameStore';
import { parseTableState, ocrResultToGameState, detectChanges } from '@/lib/ocr/stateParser';
import { initTesseract, terminateTesseract, getOCRStatus } from '@/lib/ocr/tesseract';
import { getSiteConfig, siteConfigs } from '@/lib/capture/siteConfigs';
import type { CapturedFrame, CroppedRegion, PokerSiteConfig } from '@/lib/capture/types';
import type { TableOCRResult, OCREngineStatus } from '@/lib/ocr/types';

export type CaptureStatus = 'idle' | 'initializing' | 'capturing' | 'processing' | 'error';

interface UseLiveCaptureOptions {
  fps?: number;
  autoAnalyze?: boolean;
}

interface UseLiveCaptureReturn {
  // Status
  status: CaptureStatus;
  ocrStatus: OCREngineStatus;
  error: string | null;
  
  // Capture info
  isCapturing: boolean;
  fps: number;
  frameCount: number;
  
  // Site selection
  selectedSite: string;
  availableSites: string[];
  setSite: (site: string) => void;
  
  // Controls
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  
  // Latest data
  lastOCRResult: TableOCRResult | null;
  lastFrameDataUrl: string | null;
  lastFrameTime: number;
  processingTime: number;
}

export function useLiveCapture(
  options: UseLiveCaptureOptions = {}
): UseLiveCaptureReturn {
  const { fps = 2, autoAnalyze = true } = options;
  
  // State
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<OCREngineStatus>({ 
    initialized: false, 
    loading: false,
    isReady: false,
    isProcessing: false,
    progress: 0,
    error: null,
  });
  const [selectedSite, setSelectedSite] = useState('generic');
  const [lastOCRResult, setLastOCRResult] = useState<TableOCRResult | null>(null);
  const [lastFrameDataUrl, setLastFrameDataUrl] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState(0);
  
  // Refs
  const previousResultRef = useRef<TableOCRResult | null>(null);
  const isProcessingRef = useRef(false);
  const siteConfigRef = useRef<PokerSiteConfig>(getSiteConfig('generic'));
  
  // Store actions
  const {
    setPlayers,
    setCommunityCards,
    setHandState,
    setOCRResult,
    setCaptureState,
    addAlert,
  } = useGameStore();
  
  // Update site config when selection changes
  useEffect(() => {
    siteConfigRef.current = getSiteConfig(selectedSite);
  }, [selectedSite]);
  
  // Handle frame processing
  const handleFrame = useCallback(async (frame: CapturedFrame, regions: CroppedRegion[]) => {
    // Skip if already processing
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setStatus('processing');
    
    const startTime = performance.now();
    
    // Debug logging
    console.log(`🎬 [Capture] Processing frame: ${frame.width}x${frame.height}px at ${new Date().toISOString()}`);
    
    // Check if frame data is valid (not all black)
    const frameData = frame.imageData.data;
    let nonBlackPixels = 0;
    const samplePixels: string[] = [];
    for (let i = 0; i < Math.min(frameData.length, 1000); i += 40) {
      const r = frameData[i];
      const g = frameData[i + 1];
      const b = frameData[i + 2];
      if (r > 0 || g > 0 || b > 0) nonBlackPixels++;
      if (samplePixels.length < 5) samplePixels.push(`(${r},${g},${b})`);
    }
    console.log(`🖼️ [Frame Check] Non-black pixels in first 1000: ${nonBlackPixels}/25, samples: ${samplePixels.join(', ')}`);
    
    if (nonBlackPixels === 0) {
      console.error('❌ [Frame Check] FRAME DATA IS ALL BLACK! This indicates a browser security restriction.');
      console.error('   Possible causes:');
      console.error('   1. Capturing a browser window with protected content');
      console.error('   2. Screen sharing permissions issue');
      console.error('   3. Try sharing a specific window instead of entire screen');
      console.error('   4. Try running Ignition in a regular window (not incognito/private)');
    }
    
    console.log(`📦 [Capture] Extracted ${regions.length} regions: ${regions.slice(0, 5).map(r => r.label).join(', ')}...`);
    
    // Convert frame to data URL for preview
    try {
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(frame.imageData, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setLastFrameDataUrl(dataUrl);
        
        // Generate previews for key regions (communityCards, pot, heroCards)
        const regionPreviews = regions
          .filter(r => ['communityCards', 'pot', 'heroCards'].includes(r.label))
          .map(r => {
            const regionCanvas = document.createElement('canvas');
            regionCanvas.width = r.imageData.width;
            regionCanvas.height = r.imageData.height;
            const regionCtx = regionCanvas.getContext('2d');
            if (regionCtx) {
              regionCtx.putImageData(r.imageData, 0, 0);
              return {
                label: r.label,
                dataUrl: regionCanvas.toDataURL('image/png'),
                width: r.imageData.width,
                height: r.imageData.height,
              };
            }
            return null;
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);
        
        setCaptureState({ lastFrameDataUrl: dataUrl, regionPreviews });
        console.log('✅ [Capture] Frame + region previews created');
      }
    } catch (e) {
      console.error('❌ [Capture] Failed to create frame preview:', e);
    }
    
    try {
      console.log('🔍 [OCR] Starting table state parsing...');
      
      // Parse table state from regions
      const ocrResult = await parseTableState(regions, siteConfigRef.current);
      
      console.log('📊 [OCR] Parse complete:', {
        confidence: ocrResult.confidence,
        street: ocrResult.currentStreet,
        pot: ocrResult.pot,
        playersDetected: ocrResult.players.length,
        communityCards: ocrResult.communityCards.map(c => 
          c.card ? `${c.card.rank}${c.card.suit[0]}` : (c.isHidden ? '??' : '--')
        ),
        heroSeat: ocrResult.heroSeat,
      });
      
      setLastOCRResult(ocrResult);
      setOCRResult(ocrResult);
      
      // Detect changes from previous result
      if (previousResultRef.current) {
        const changes = detectChanges(ocrResult, previousResultRef.current);
        
        // Alert on significant changes
        if (changes.newStreet) {
          addAlert({
            type: 'info',
            title: 'New Street',
            message: `${ocrResult.currentStreet.charAt(0).toUpperCase() + ocrResult.currentStreet.slice(1)} dealt`,
          });
        }
      }
      
      // Convert to game state format and update store
      const gameState = ocrResultToGameState(ocrResult);
      
      // Update store with new state
      setHandState({
        street: gameState.street,
        pot: gameState.pot,
        dealerSeat: gameState.dealerSeat || 0,
        activeSeat: gameState.activeSeat,
        heroSeat: gameState.heroSeat,
      });
      
      setCommunityCards(gameState.communityCards);
      
      // Map players to store format
      const playerStates = gameState.players.map(p => ({
        id: `player-${p.seatNumber}`,
        seatNumber: p.seatNumber,
        name: p.name,
        stack: p.stack,
        position: getPositionFromSeat(p.seatNumber, gameState.dealerSeat || 0, gameState.players.length),
        isHero: p.seatNumber === gameState.heroSeat,
        isActive: p.isActive,
        isFolded: p.isFolded,
        isAllIn: false,
        currentBet: p.currentBet,
        holeCards: p.holeCards || null,
        persona: 'unknown',
      }));
      
      setPlayers(playerStates);
      
      // Store current result for next comparison
      previousResultRef.current = ocrResult;
      
      setProcessingTime(performance.now() - startTime);
      setStatus('capturing');
      
    } catch (err) {
      console.error('OCR processing error:', err);
      setError(err instanceof Error ? err.message : 'OCR processing failed');
      setStatus('error');
    } finally {
      isProcessingRef.current = false;
    }
  }, [setPlayers, setCommunityCards, setHandState, setOCRResult, addAlert]);
  
  // Screen capture hook
  const {
    state: captureState,
    start: startScreenCapture,
    stop: stopScreenCapture,
    isSupported,
  } = useScreenCapture({
    fps,
    siteConfig: siteConfigRef.current,
    onFrame: handleFrame,
    onError: (err) => {
      setError(err);
      setStatus('error');
    },
  });
  
  // Start capture
  const startCapture = useCallback(async () => {
    setError(null);
    setStatus('initializing');
    
    try {
      // Initialize Tesseract if needed
      if (!ocrStatus.initialized) {
        setOcrStatus(prev => ({ ...prev, initialized: false, loading: true }));
        await initTesseract();
        setOcrStatus(prev => ({ ...prev, initialized: true, loading: false, isReady: true }));
      }
      
      // Start screen capture
      await startScreenCapture();
      
      setCaptureState({ isCapturing: true });
      setStatus('capturing');
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start capture';
      setError(message);
      setStatus('error');
      setCaptureState({ isCapturing: false, errors: [message] });
    }
  }, [ocrStatus.initialized, startScreenCapture, setCaptureState]);
  
  // Stop capture
  const stopCapture = useCallback(() => {
    stopScreenCapture();
    setCaptureState({ isCapturing: false });
    setStatus('idle');
    previousResultRef.current = null;
  }, [stopScreenCapture, setCaptureState]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScreenCapture();
      terminateTesseract();
    };
  }, [stopScreenCapture]);
  
  // Get available sites
  const availableSites = Object.keys(siteConfigs);
  
  return {
    status,
    ocrStatus,
    error,
    isCapturing: captureState.isCapturing,
    fps: captureState.fps,
    frameCount: captureState.frameCount,
    selectedSite,
    availableSites,
    setSite: setSelectedSite,
    startCapture,
    stopCapture,
    lastOCRResult,
    lastFrameDataUrl,
    lastFrameTime: captureState.lastFrameTime,
    processingTime,
  };
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
