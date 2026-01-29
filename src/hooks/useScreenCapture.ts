/**
 * React hook for screen capture
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ScreenCaptureManager, 
  CapturedFrame, 
  CaptureState, 
  CaptureOptions,
  CroppedRegion,
  PokerSiteConfig,
  extractRegions,
  getSiteConfig,
} from '@/lib/capture';

interface UseScreenCaptureOptions extends CaptureOptions {
  siteConfig?: PokerSiteConfig | string;
  onFrame?: (frame: CapturedFrame, regions: CroppedRegion[]) => void;
  onError?: (error: string) => void;
}

interface UseScreenCaptureReturn {
  state: CaptureState;
  latestFrame: CapturedFrame | null;
  regions: CroppedRegion[];
  start: () => Promise<void>;
  stop: () => void;
  captureNow: () => CapturedFrame | null;
  isSupported: boolean;
}

export function useScreenCapture(
  options: UseScreenCaptureOptions = {}
): UseScreenCaptureReturn {
  const { 
    siteConfig: siteConfigInput, 
    onFrame, 
    onError,
    ...captureOptions 
  } = options;

  const [state, setState] = useState<CaptureState>({
    isCapturing: false,
    stream: null,
    fps: 0,
    lastFrameTime: 0,
    frameCount: 0,
    errors: [],
  });

  const [latestFrame, setLatestFrame] = useState<CapturedFrame | null>(null);
  const [regions, setRegions] = useState<CroppedRegion[]>([]);
  
  const managerRef = useRef<ScreenCaptureManager | null>(null);
  
  // Resolve site config
  const siteConfig = typeof siteConfigInput === 'string' 
    ? getSiteConfig(siteConfigInput)
    : siteConfigInput || getSiteConfig('generic');

  // Check if screen capture is supported
  const isSupported = typeof window !== 'undefined' && 
    !!navigator.mediaDevices?.getDisplayMedia;

  // Handle frame capture
  const handleFrame = useCallback((frame: CapturedFrame) => {
    setLatestFrame(frame);
    
    // Extract regions using site config
    try {
      const extractedRegions = extractRegions(frame, siteConfig);
      setRegions(extractedRegions);
      onFrame?.(frame, extractedRegions);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Region extraction failed';
      onError?.(message);
    }
    
    // Update state
    if (managerRef.current) {
      setState(managerRef.current.getState());
    }
  }, [siteConfig, onFrame, onError]);

  // Start capture
  const start = useCallback(async () => {
    if (!isSupported) {
      onError?.('Screen capture is not supported in this browser');
      return;
    }

    try {
      managerRef.current = new ScreenCaptureManager(captureOptions);
      await managerRef.current.start(handleFrame);
      setState(managerRef.current.getState());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start capture';
      onError?.(message);
      setState(prev => ({ ...prev, errors: [...prev.errors, message] }));
    }
  }, [isSupported, captureOptions, handleFrame, onError]);

  // Stop capture
  const stop = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.stop();
      setState(managerRef.current.getState());
    }
    setLatestFrame(null);
    setRegions([]);
  }, []);

  // Capture on demand
  const captureNow = useCallback((): CapturedFrame | null => {
    if (!managerRef.current) return null;
    return managerRef.current.captureNow();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.stop();
      }
    };
  }, []);

  return {
    state,
    latestFrame,
    regions,
    start,
    stop,
    captureNow,
    isSupported,
  };
}
