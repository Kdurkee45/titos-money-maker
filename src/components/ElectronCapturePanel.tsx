'use client';

/**
 * Electron Capture Control Panel
 * 
 * A comprehensive panel for controlling native screen capture when running in Electron.
 * Provides source selection, capture controls, and real-time status.
 */

import { useState } from 'react';
import { useElectronCapture } from '@/hooks/useElectronCapture';
import { ElectronSourceSelector } from './ElectronSourceSelector';

interface ElectronCapturePanelProps {
  compact?: boolean;
  onOpenDebug?: () => void;
}

export function ElectronCapturePanel({ compact = false, onOpenDebug }: ElectronCapturePanelProps) {
  const {
    state,
    latestFrame,
    isElectronAvailable,
    refreshSources,
    selectSource,
    start,
    stop,
  } = useElectronCapture({ 
    fps: 2,
    siteConfig: 'ignition',
  });

  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showSourceSelector, setShowSourceSelector] = useState(false);

  // Not in Electron - show fallback message
  if (!isElectronAvailable) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center gap-3 text-yellow-400">
          <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-semibold">Running in Browser Mode</h3>
            <p className="text-sm text-yellow-300/80">
              For reliable screen capture without browser restrictions, run the app in Electron mode.
            </p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-400 mb-2">To start in Electron mode:</p>
          <code className="block bg-slate-900 p-2 rounded text-sm text-emerald-400">
            npm run electron:dev
          </code>
        </div>
      </div>
    );
  }

  // Compact view
  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
      >
        <span className={`w-2 h-2 rounded-full ${
          state.isCapturing ? 'bg-green-500' : 'bg-gray-500'
        }`} />
        <span className="text-sm text-slate-300">
          {state.isCapturing ? 'Capturing' : 'Electron Capture'}
        </span>
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${
            state.isCapturing ? 'bg-green-500' : 'bg-gray-500'
          }`} />
          <h3 className="font-semibold text-white">Electron Capture</h3>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
            Native
          </span>
        </div>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Status</span>
          <span className={`text-sm font-medium ${
            state.isCapturing ? 'text-green-400' : 'text-slate-300'
          }`}>
            {state.isCapturing ? 'Capturing' : 'Ready'}
          </span>
        </div>

        {/* Error Display */}
        {state.errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{state.errors[state.errors.length - 1]}</p>
          </div>
        )}

        {/* Selected Source */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-400">Capture Source</label>
            <button
              onClick={() => setShowSourceSelector(!showSourceSelector)}
              disabled={state.isCapturing}
              className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
            >
              {showSourceSelector ? 'Hide' : 'Change Source'}
            </button>
          </div>
          
          {state.selectedSource ? (
            <div className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg">
              {state.selectedSource.thumbnail && (
                <img 
                  src={state.selectedSource.thumbnail} 
                  alt="Preview"
                  className="w-16 h-10 object-cover rounded"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">
                  {state.selectedSource.name}
                </p>
                <p className="text-xs text-slate-500">
                  {state.selectedSource.id.startsWith('window:') ? 'Window' : 'Screen'}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSourceSelector(true)}
              className="w-full p-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-colors"
            >
              Click to select a capture source
            </button>
          )}
        </div>

        {/* Source Selector */}
        {showSourceSelector && (
          <ElectronSourceSelector
            sources={state.availableSources}
            selectedSource={state.selectedSource}
            onSelect={(source) => {
              selectSource(source);
              setShowSourceSelector(false);
            }}
            onRefresh={refreshSources}
            isCapturing={state.isCapturing}
          />
        )}

        {/* Capture Stats */}
        {state.isCapturing && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-white">{state.fps.toFixed(1)}</div>
              <div className="text-xs text-slate-500">FPS</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-white">{state.frameCount}</div>
              <div className="text-xs text-slate-500">Frames</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-white">
                {latestFrame ? `${latestFrame.width}x${latestFrame.height}` : '-'}
              </div>
              <div className="text-xs text-slate-500">Resolution</div>
            </div>
          </div>
        )}

        {/* Frame Preview */}
        {state.isCapturing && latestFrame && (
          <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
            <canvas
              ref={(canvas) => {
                if (canvas && latestFrame) {
                  canvas.width = latestFrame.width;
                  canvas.height = latestFrame.height;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.putImageData(latestFrame.imageData, 0, 0);
                  }
                }
              }}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!state.isCapturing ? (
            <button
              onClick={start}
              disabled={!state.selectedSource}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Start Capture
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Capture
            </button>
          )}
        </div>

        {/* Debug Button */}
        {onOpenDebug && (
          <button
            onClick={onOpenDebug}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Debug View
          </button>
        )}

        {/* Help Text */}
        <div className="text-xs text-slate-500 space-y-1">
          <p className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Native capture bypasses browser restrictions
          </p>
          <p className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Full pixel access for card and text recognition
          </p>
        </div>
      </div>
    </div>
  );
}
