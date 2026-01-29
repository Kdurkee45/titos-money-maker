'use client';

/* eslint-disable @next/next/no-img-element */

/**
 * Electron Source Selector
 * 
 * A component for selecting which window or screen to capture
 * when running in Electron mode.
 */

import { useState } from 'react';
import { type ElectronSource } from '@/lib/capture/electronCapture';

interface ElectronSourceSelectorProps {
  sources: ElectronSource[];
  selectedSource: ElectronSource | null;
  onSelect: (source: ElectronSource) => void;
  onRefresh: () => void;
  isCapturing: boolean;
}

export function ElectronSourceSelector({
  sources,
  selectedSource,
  onSelect,
  onRefresh,
  isCapturing,
}: ElectronSourceSelectorProps) {
  const [filter, setFilter] = useState<'all' | 'windows' | 'screens'>('all');

  const filteredSources = sources.filter(source => {
    if (filter === 'windows') return source.id.startsWith('window:');
    if (filter === 'screens') return source.id.startsWith('screen:');
    return true;
  });

  // Highlight poker-related windows
  const isPokerWindow = (name: string) => {
    const lowerName = name.toLowerCase();
    return lowerName.includes('ignition') || 
           lowerName.includes('poker') || 
           lowerName.includes('zone') ||
           lowerName.includes('bovada');
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Select Capture Source</h3>
          <p className="text-sm text-slate-400">
            Choose a window or screen to capture
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isCapturing}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'windows', 'screens'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Source List */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
        {filteredSources.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-400">
            No sources found. Click Refresh to scan for windows.
          </div>
        ) : (
          filteredSources.map(source => (
            <button
              key={source.id}
              onClick={() => onSelect(source)}
              disabled={isCapturing}
              className={`relative p-2 rounded-lg border-2 transition-all text-left ${
                selectedSource?.id === source.id
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : isPokerWindow(source.name)
                    ? 'border-yellow-500/50 bg-yellow-500/5 hover:border-yellow-500'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
              } ${isCapturing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video rounded overflow-hidden bg-slate-900 mb-2">
                {source.thumbnail ? (
                  <img 
                    src={source.thumbnail} 
                    alt={source.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Poker window badge */}
                {isPokerWindow(source.name) && (
                  <div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded font-medium">
                    Poker
                  </div>
                )}
                
                {/* Selected indicator */}
                {selectedSource?.id === source.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/30">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Name */}
              <p className="text-sm text-white truncate" title={source.name}>
                {source.name}
              </p>
              <p className="text-xs text-slate-500">
                {source.id.startsWith('window:') ? 'Window' : 'Screen'}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Selected Source Info */}
      {selectedSource && (
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-400">Selected for capture:</p>
            <p className="text-sm text-white truncate">{selectedSource.name}</p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-slate-500 space-y-1">
        <p>
          <span className="text-yellow-400">●</span> Yellow border indicates poker-related windows
        </p>
        <p>
          <span className="text-emerald-400">●</span> Green border indicates selected source
        </p>
      </div>
    </div>
  );
}
