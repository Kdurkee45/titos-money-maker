'use client';

/**
 * Calibration Tool for Poker Site Configurations
 * 
 * This tool helps you:
 * 1. Capture a poker table screenshot
 * 2. Define regions for cards, pot, players, etc.
 * 3. Test OCR on specific regions
 * 4. Save card templates for recognition
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useScreenCapture } from '@/hooks/useScreenCapture';

interface Region {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface CalibrationToolProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig?: (regions: Region[]) => void;
}

const DEFAULT_REGIONS: Region[] = [
  { name: 'pot', x: 0.42, y: 0.35, width: 0.16, height: 0.05, color: '#ffcc00' },
  { name: 'communityCards', x: 0.32, y: 0.42, width: 0.36, height: 0.12, color: '#00ff00' },
  { name: 'heroCards', x: 0.44, y: 0.60, width: 0.12, height: 0.10, color: '#00ccff' },
  { name: 'seat1', x: 0.42, y: 0.75, width: 0.16, height: 0.15, color: '#ff6600' },
  { name: 'seat2', x: 0.72, y: 0.65, width: 0.14, height: 0.15, color: '#ff6600' },
  { name: 'seat3', x: 0.72, y: 0.18, width: 0.14, height: 0.15, color: '#ff6600' },
  { name: 'seat4', x: 0.42, y: 0.05, width: 0.16, height: 0.15, color: '#ff6600' },
  { name: 'seat5', x: 0.12, y: 0.18, width: 0.14, height: 0.15, color: '#ff6600' },
  { name: 'seat6', x: 0.12, y: 0.65, width: 0.14, height: 0.15, color: '#ff6600' },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CalibrationTool({ isOpen, onClose, onSaveConfig }: CalibrationToolProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>(DEFAULT_REGIONS);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showRegions, setShowRegions] = useState(true);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopCaptureRef = useRef<(() => void) | null>(null);
  const capturedOnceRef = useRef(false);
  
  const { start, stop, state } = useScreenCapture({
    onFrame: useCallback((frame) => {
      // Only capture one frame
      if (capturedOnceRef.current) return;
      capturedOnceRef.current = true;
      
      // Convert frame to data URL
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(frame.imageData, 0, 0);
        setCapturedImage(canvas.toDataURL('image/png'));
        setImageSize({ width: frame.width, height: frame.height });
      }
      
      // Stop capture using ref (avoids circular dependency)
      if (stopCaptureRef.current) {
        stopCaptureRef.current();
      }
    }, []),
    onError: (error) => console.error('Capture error:', error),
    fps: 1,
    siteConfig: 'ignition',
  });
  
  const isCapturing = state.isCapturing;
  
  // Store stop in ref so callback can access it
  useEffect(() => {
    stopCaptureRef.current = stop;
  }, [stop]);

  // Draw regions on canvas when image or regions change
  useEffect(() => {
    if (!capturedImage || !canvasRef.current || !showRegions) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Draw regions
      regions.forEach(region => {
        const x = region.x * img.width;
        const y = region.y * img.height;
        const w = region.width * img.width;
        const h = region.height * img.height;
        
        ctx.strokeStyle = region.name === selectedRegion ? '#ffffff' : region.color;
        ctx.lineWidth = region.name === selectedRegion ? 3 : 2;
        ctx.setLineDash(region.name === selectedRegion ? [] : [5, 5]);
        ctx.strokeRect(x, y, w, h);
        
        // Draw label
        ctx.fillStyle = region.color;
        ctx.font = '12px monospace';
        ctx.fillText(region.name, x + 4, y - 4);
      });
    };
    img.src = capturedImage;
  }, [capturedImage, regions, selectedRegion, showRegions]);

  const handleCaptureClick = async () => {
    try {
      // Reset the capture flag so we can capture again
      capturedOnceRef.current = false;
      await start();
    } catch (error) {
      console.error('Failed to start capture:', error);
    }
  };

  const handleRegionChange = (name: string, field: keyof Region, value: number) => {
    setRegions(prev => prev.map(r => 
      r.name === name ? { ...r, [field]: value } : r
    ));
  };

  const handleExportConfig = () => {
    const config = regions.reduce((acc, region) => {
      acc[region.name] = {
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
      };
      return acc;
    }, {} as Record<string, { x: number; y: number; width: number; height: number }>);
    
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ignition-regions.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCardTemplate = async (cardName: string) => {
    if (!canvasRef.current || !selectedRegion) return;
    
    const region = regions.find(r => r.name === selectedRegion);
    if (!region) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const x = Math.floor(region.x * canvas.width);
    const y = Math.floor(region.y * canvas.height);
    const w = Math.floor(region.width * canvas.width);
    const h = Math.floor(region.height * canvas.height);
    
    const imageData = ctx.getImageData(x, y, w, h);
    
    // Convert to template format
    const template = {
      name: cardName,
      width: w,
      height: h,
      data: Array.from(imageData.data),
    };
    
    console.log('Card template saved:', template);
    alert(`Template for ${cardName} saved to console. Use this data to train the card recognizer.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/90">
      {/* Left panel - Image */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Calibration Tool</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCaptureClick}
              disabled={isCapturing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              {isCapturing ? 'Capturing...' : 'Capture Screen'}
            </button>
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={showRegions}
                onChange={(e) => setShowRegions(e.target.checked)}
                className="rounded"
              />
              Show Regions
            </label>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {capturedImage ? (
            <div className="relative inline-block">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto border border-slate-600 rounded"
              />
              {imageSize.width > 0 && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {imageSize.width} × {imageSize.height}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 border-2 border-dashed border-slate-600 rounded-lg">
              <div className="text-center">
                <svg className="w-16 h-16 text-slate-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-400 mb-2">No image captured</p>
                <p className="text-slate-500 text-sm">Click &quot;Capture Screen&quot; and select your poker window</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right panel - Region editor */}
      <div className="w-96 border-l border-slate-700 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-2">Region Editor</h3>
          <p className="text-slate-400 text-sm">
            Adjust the region coordinates to match your poker table layout.
            Values are percentages (0-1) of the image dimensions.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {regions.map(region => (
            <div
              key={region.name}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedRegion === region.name
                  ? 'bg-slate-700 border-white'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-500'
              }`}
              onClick={() => setSelectedRegion(region.name)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: region.color }}
                />
                <span className="font-medium text-white">{region.name}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <label className="flex items-center gap-1 text-slate-400">
                  X:
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={region.x}
                    onChange={(e) => handleRegionChange(region.name, 'x', parseFloat(e.target.value))}
                    className="w-16 px-1 py-0.5 bg-slate-900 border border-slate-600 rounded text-white"
                  />
                </label>
                <label className="flex items-center gap-1 text-slate-400">
                  Y:
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={region.y}
                    onChange={(e) => handleRegionChange(region.name, 'y', parseFloat(e.target.value))}
                    className="w-16 px-1 py-0.5 bg-slate-900 border border-slate-600 rounded text-white"
                  />
                </label>
                <label className="flex items-center gap-1 text-slate-400">
                  W:
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={region.width}
                    onChange={(e) => handleRegionChange(region.name, 'width', parseFloat(e.target.value))}
                    className="w-16 px-1 py-0.5 bg-slate-900 border border-slate-600 rounded text-white"
                  />
                </label>
                <label className="flex items-center gap-1 text-slate-400">
                  H:
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={region.height}
                    onChange={(e) => handleRegionChange(region.name, 'height', parseFloat(e.target.value))}
                    className="w-16 px-1 py-0.5 bg-slate-900 border border-slate-600 rounded text-white"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-700 space-y-3">
          <button
            onClick={handleExportConfig}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Export Configuration
          </button>
          
          {selectedRegion && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Save selected region as card template:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Card name (e.g., Ah, Kd)"
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                  id="cardTemplateName"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('cardTemplateName') as HTMLInputElement;
                    if (input?.value) handleSaveCardTemplate(input.value);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalibrationTool;
