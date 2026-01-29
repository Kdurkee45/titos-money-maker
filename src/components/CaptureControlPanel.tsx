'use client';

/**
 * Capture Control Panel
 * UI for controlling screen capture and viewing OCR status
 */

import { useState } from 'react';
import { useLiveCapture, CaptureStatus } from '@/hooks/useLiveCapture';

interface CaptureControlPanelProps {
  compact?: boolean;
  onOpenDebug?: () => void;
  onOpenCalibration?: () => void;
}

export function CaptureControlPanel({ compact = false, onOpenDebug, onOpenCalibration }: CaptureControlPanelProps) {
  const {
    status,
    ocrStatus,
    error,
    isCapturing,
    fps,
    frameCount,
    selectedSite,
    availableSites,
    setSite,
    startCapture,
    stopCapture,
    processingTime,
  } = useLiveCapture({ fps: 2 });

  const [isExpanded, setIsExpanded] = useState(!compact);

  const statusColors: Record<CaptureStatus, string> = {
    idle: 'bg-gray-500',
    initializing: 'bg-yellow-500 animate-pulse',
    capturing: 'bg-green-500',
    processing: 'bg-blue-500 animate-pulse',
    error: 'bg-red-500',
  };

  const statusLabels: Record<CaptureStatus, string> = {
    idle: 'Ready',
    initializing: 'Initializing...',
    capturing: 'Capturing',
    processing: 'Processing...',
    error: 'Error',
  };

  // Compact view (just a status indicator and toggle)
  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
      >
        <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
        <span className="text-sm text-slate-300">
          {isCapturing ? 'Live' : 'Capture'}
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
          <span className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
          <h3 className="font-semibold text-white">Screen Capture</h3>
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
            status === 'error' ? 'text-red-400' : 
            status === 'capturing' ? 'text-green-400' : 
            'text-slate-300'
          }`}>
            {statusLabels[status]}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Site Selection */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Poker Site</label>
          <select
            value={selectedSite}
            onChange={(e) => setSite(e.target.value)}
            disabled={isCapturing}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {availableSites.map((site) => (
              <option key={site} value={site}>
                {site.charAt(0).toUpperCase() + site.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Capture Stats */}
        {isCapturing && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-white">{fps.toFixed(1)}</div>
              <div className="text-xs text-slate-500">FPS</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-white">{frameCount}</div>
              <div className="text-xs text-slate-500">Frames</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-white">{processingTime.toFixed(0)}</div>
              <div className="text-xs text-slate-500">ms/frame</div>
            </div>
          </div>
        )}

        {/* OCR Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">OCR Engine</span>
          <span className={`font-medium ${
            ocrStatus.loading ? 'text-yellow-400' :
            ocrStatus.initialized ? 'text-green-400' :
            'text-slate-500'
          }`}>
            {ocrStatus.loading ? 'Loading...' :
             ocrStatus.initialized ? 'Ready' :
             'Not initialized'}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isCapturing ? (
            <button
              onClick={startCapture}
              disabled={status === 'initializing'}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {status === 'initializing' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Start Capture
                </>
              )}
            </button>
          ) : (
            <button
              onClick={stopCapture}
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

        {/* Debug & Calibration Buttons */}
        <div className="flex gap-2">
          {onOpenDebug && (
            <button
              onClick={onOpenDebug}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Debug
            </button>
          )}
          {onOpenCalibration && (
            <button
              onClick={onOpenCalibration}
              className="flex-1 py-2 px-3 bg-purple-800 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Calibrate
            </button>
          )}
        </div>

        {/* Help Text */}
        <p className="text-xs text-slate-500 text-center">
          {isCapturing
            ? 'Capturing your screen. Point at a poker table.'
            : 'Click Start to share your screen with the poker table.'}
        </p>
      </div>
    </div>
  );
}
