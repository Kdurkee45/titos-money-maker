/**
 * React hook for Electron native screen capture
 * 
 * This hook provides screen capture functionality using Electron's native
 * desktopCapturer API, bypassing browser security restrictions.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  isElectron, 
  getCaptureSources, 
  dataUrlToImageData,
  type ElectronSource,
  type CaptureFrameResult,
} from '@/lib/capture/electronCapture';
import { 
  CapturedFrame, 
  CroppedRegion,
  PokerSiteConfig,
  extractRegions,
  getSiteConfig,
} from '@/lib/capture';

interface ElectronCaptureState {
  isCapturing: boolean;
  selectedSource: ElectronSource | null;
  availableSources: ElectronSource[];
  fps: number;
  lastFrameTime: number;
  frameCount: number;
  errors: string[];
}

interface UseElectronCaptureOptions {
  siteConfig?: PokerSiteConfig | string;
  fps?: number;
  onFrame?: (frame: CapturedFrame, regions: CroppedRegion[]) => void;
  onError?: (error: string) => void;
  autoSelectIgnition?: boolean;
}

interface UseElectronCaptureReturn {
  state: ElectronCaptureState;
  latestFrame: CapturedFrame | null;
  regions: CroppedRegion[];
  isElectronAvailable: boolean;
  refreshSources: () => Promise<void>;
  selectSource: (source: ElectronSource) => void;
  start: () => Promise<void>;
  stop: () => void;
}

export function useElectronCapture(
  options: UseElectronCaptureOptions = {}
): UseElectronCaptureReturn {
  const { 
    siteConfig: siteConfigInput, 
    fps = 1,
    onFrame, 
    onError,
    autoSelectIgnition = true,
  } = options;

  const [state, setState] = useState<ElectronCaptureState>({
    isCapturing: false,
    selectedSource: null,
    availableSources: [],
    fps: 0,
    lastFrameTime: 0,
    frameCount: 0,
    errors: [],
  });

  const [latestFrame, setLatestFrame] = useState<CapturedFrame | null>(null);
  const [regions, setRegions] = useState<CroppedRegion[]>([]);
  
  const cleanupRef = useRef<(() => void) | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());
  
  // Resolve site config
  const siteConfig = typeof siteConfigInput === 'string' 
    ? getSiteConfig(siteConfigInput)
    : siteConfigInput || getSiteConfig('generic');

  const isElectronAvailable = isElectron();

  // Refresh available sources
  const refreshSources = useCallback(async () => {
    if (!isElectronAvailable) {
      onError?.('Not running in Electron');
      return;
    }

    try {
      const sources = await getCaptureSources();
      setState(prev => ({ ...prev, availableSources: sources }));
      
      // Auto-select Ignition window if enabled
      if (autoSelectIgnition && sources.length > 0) {
        const ignitionSource = sources.find(s => 
          s.name.toLowerCase().includes('ignition') ||
          s.name.toLowerCase().includes('poker') ||
          s.name.toLowerCase().includes('zone')
        );
        
        if (ignitionSource) {
          setState(prev => ({ ...prev, selectedSource: ignitionSource }));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get sources';
      onError?.(message);
      setState(prev => ({ ...prev, errors: [...prev.errors, message] }));
    }
  }, [isElectronAvailable, autoSelectIgnition, onError]);

  // Select a source for capture
  const selectSource = useCallback((source: ElectronSource) => {
    setState(prev => ({ ...prev, selectedSource: source }));
  }, []);

  // Process a captured frame
  const processFrame = useCallback(async (frameData: CaptureFrameResult) => {
    try {
      // Convert data URL to ImageData
      const imageData = await dataUrlToImageData(frameData.dataUrl);
      
      const frame: CapturedFrame = {
        imageData,
        width: frameData.width,
        height: frameData.height,
        timestamp: frameData.timestamp,
      };
      
      setLatestFrame(frame);
      
      // Extract regions using site config
      const extractedRegions = extractRegions(frame, siteConfig);
      setRegions(extractedRegions);
      onFrame?.(frame, extractedRegions);
      
      // Update FPS
      frameCountRef.current++;
      const now = Date.now();
      const elapsed = now - lastFpsUpdateRef.current;
      
      if (elapsed >= 1000) {
        const currentFps = frameCountRef.current / (elapsed / 1000);
        setState(prev => ({ 
          ...prev, 
          fps: Math.round(currentFps * 10) / 10,
          lastFrameTime: now,
          frameCount: prev.frameCount + frameCountRef.current,
        }));
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }
      
      // Check if frame data is valid (not all black)
      const data = imageData.data;
      let nonBlackPixels = 0;
      for (let i = 0; i < Math.min(data.length, 1000); i += 40) {
        if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) {
          nonBlackPixels++;
        }
      }
      
      if (nonBlackPixels > 0) {
        console.log(`✅ [Electron Capture] Frame captured: ${frame.width}x${frame.height}, non-black pixels: ${nonBlackPixels}/25`);
      } else {
        console.warn('⚠️ [Electron Capture] Frame appears to be all black - check screen recording permissions');
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Frame processing failed';
      onError?.(message);
    }
  }, [siteConfig, onFrame, onError]);

  // Start capture
  const start = useCallback(async () => {
    if (!isElectronAvailable) {
      onError?.('Not running in Electron');
      return;
    }

    if (!state.selectedSource) {
      onError?.('No source selected');
      return;
    }

    try {
      // Import dynamically to avoid issues when not in Electron
      const { startContinuousCapture } = await import('@/lib/capture/electronCapture');
      
      setState(prev => ({ ...prev, isCapturing: true }));
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = Date.now();
      
      const cleanup = await startContinuousCapture(
        state.selectedSource.id,
        fps,
        processFrame
      );
      
      cleanupRef.current = cleanup;
      
      console.log(`🎬 [Electron Capture] Started capturing: ${state.selectedSource.name} at ${fps} FPS`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start capture';
      onError?.(message);
      setState(prev => ({ 
        ...prev, 
        isCapturing: false,
        errors: [...prev.errors, message] 
      }));
    }
  }, [isElectronAvailable, state.selectedSource, fps, processFrame, onError]);

  // Stop capture
  const stop = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      isCapturing: false,
      fps: 0,
    }));
    setLatestFrame(null);
    setRegions([]);
    
    console.log('🛑 [Electron Capture] Stopped');
  }, []);

  // Load sources on mount if in Electron
  useEffect(() => {
    if (isElectronAvailable) {
      refreshSources();
    }
  }, [isElectronAvailable, refreshSources]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    state,
    latestFrame,
    regions,
    isElectronAvailable,
    refreshSources,
    selectSource,
    start,
    stop,
  };
}
