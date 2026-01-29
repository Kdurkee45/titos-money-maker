/**
 * Electron Native Screen Capture
 * 
 * This module provides native screen capture functionality when running
 * inside Electron, bypassing browser security restrictions.
 */

// Type definitions for Electron API exposed via preload
interface ElectronSource {
  id: string;
  name: string;
  thumbnail: string; // Data URL
  appIcon: string | null;
  display_id: string;
}

interface CaptureFrameResult {
  dataUrl: string;
  width: number;
  height: number;
  timestamp: number;
}

interface DisplayInfo {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  rotation: number;
}

interface ElectronAPI {
  getSources: () => Promise<ElectronSource[] | { error: string }>;
  captureFrame: (sourceId: string) => Promise<CaptureFrameResult | { error: string }>;
  getDisplayInfo: () => Promise<DisplayInfo>;
  startContinuousCapture: (options: { sourceId: string; fps?: number }) => Promise<{ success: boolean }>;
  stopContinuousCapture: () => Promise<{ success: boolean }>;
  onCaptureFrame: (callback: (data: CaptureFrameResult) => void) => () => void;
  isElectron: boolean;
  platform: string;
  versions: {
    electron: string;
    chrome: string;
    node: string;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
}

/**
 * Get available capture sources (windows and screens)
 */
export async function getCaptureSources(): Promise<ElectronSource[]> {
  if (!isElectron()) {
    throw new Error('Not running in Electron');
  }

  const result = await window.electronAPI!.getSources();
  
  if ('error' in result) {
    throw new Error(result.error);
  }
  
  return result;
}

/**
 * Capture a single frame from a source
 */
export async function captureFrame(sourceId: string): Promise<CaptureFrameResult> {
  if (!isElectron()) {
    throw new Error('Not running in Electron');
  }

  const result = await window.electronAPI!.captureFrame(sourceId);
  
  if ('error' in result) {
    throw new Error(result.error);
  }
  
  return result;
}

/**
 * Get display information
 */
export async function getDisplayInfo(): Promise<DisplayInfo> {
  if (!isElectron()) {
    throw new Error('Not running in Electron');
  }

  return window.electronAPI!.getDisplayInfo();
}

/**
 * Convert a data URL to ImageData for processing
 */
export async function dataUrlToImageData(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Start continuous capture
 */
export async function startContinuousCapture(
  sourceId: string,
  fps: number = 1,
  onFrame: (data: CaptureFrameResult) => void
): Promise<() => void> {
  if (!isElectron()) {
    throw new Error('Not running in Electron');
  }

  // Set up listener for frames
  const cleanup = window.electronAPI!.onCaptureFrame(onFrame);
  
  // Start capture
  await window.electronAPI!.startContinuousCapture({ sourceId, fps });
  
  // Return cleanup function
  return async () => {
    cleanup();
    await window.electronAPI!.stopContinuousCapture();
  };
}

/**
 * Find a source by name (case-insensitive partial match)
 */
export async function findSourceByName(searchName: string): Promise<ElectronSource | null> {
  const sources = await getCaptureSources();
  const lowerSearch = searchName.toLowerCase();
  
  return sources.find(source => 
    source.name.toLowerCase().includes(lowerSearch)
  ) || null;
}

/**
 * Find Ignition Casino window
 */
export async function findIgnitionWindow(): Promise<ElectronSource | null> {
  const sources = await getCaptureSources();
  
  // Look for various possible Ignition window names
  const ignitionPatterns = [
    'ignition',
    'poker',
    'zone poker',
    'table',
  ];
  
  for (const pattern of ignitionPatterns) {
    const source = sources.find(s => 
      s.name.toLowerCase().includes(pattern)
    );
    if (source) {
      return source;
    }
  }
  
  return null;
}

export type { ElectronSource, CaptureFrameResult, DisplayInfo };
