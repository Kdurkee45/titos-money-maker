'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

/**
 * Capture Debug Panel
 * Shows raw captured frames, extracted regions, and OCR results
 */

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ignitionConfig } from '@/lib/capture/siteConfigs';

interface CaptureDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CaptureDebugPanel({ isOpen, onClose }: CaptureDebugPanelProps) {
  const { capture, hand, players } = useGameStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'regions' | 'ocr' | 'state'>('preview');
  const [showRegionOverlays, setShowRegionOverlays] = useState(true);
  
  if (!isOpen) return null;

  const ocrResult = capture.lastOCRResult;
  const frameDataUrl = capture.lastFrameDataUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">Capture Debug View</h2>
            {capture.isCapturing && (
              <span className="flex items-center gap-2 text-sm text-emerald-400">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 shrink-0">
          {([
            { id: 'preview', label: 'Frame Preview' },
            { id: 'regions', label: 'Region Overlay' },
            { id: 'ocr', label: 'OCR Results' },
            { id: 'state', label: 'Game State' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'preview' && (
            <FramePreviewTab frameDataUrl={frameDataUrl} isCapturing={capture.isCapturing} />
          )}
          {activeTab === 'regions' && (
            <RegionOverlayTab 
              frameDataUrl={frameDataUrl} 
              showOverlays={showRegionOverlays}
              onToggleOverlays={() => setShowRegionOverlays(!showRegionOverlays)}
            />
          )}
          {activeTab === 'ocr' && (
            <OCRResultsTab ocrResult={ocrResult} />
          )}
          {activeTab === 'state' && (
            <GameStateTab hand={hand} players={players} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Region Overlay Tab - Shows the captured frame with region boxes overlaid
 * This helps visualize where the system is looking for cards, pot, players, etc.
 */
function RegionOverlayTab({ 
  frameDataUrl, 
  showOverlays, 
  onToggleOverlays 
}: { 
  frameDataUrl: string | null; 
  showOverlays: boolean;
  onToggleOverlays: () => void;
}) {
  const config = ignitionConfig;
  const regions = config.regions;

  if (!frameDataUrl) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Frame Captured</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Start screen capture first to see the region overlays.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Region Configuration: {config.displayName}</h3>
          <p className="text-sm text-slate-400">Colored boxes show where the system looks for data</p>
        </div>
        <button
          onClick={onToggleOverlays}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showOverlays 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {showOverlays ? 'Hide Overlays' : 'Show Overlays'}
        </button>
      </div>

      {/* Frame with Overlays */}
      <div className="relative bg-slate-800 rounded-lg overflow-hidden">
        <img 
          src={frameDataUrl} 
          alt="Captured frame" 
          className="w-full h-auto"
        />
        
        {showOverlays && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Community Cards Region */}
            <div
              className="absolute border-2 border-yellow-400 bg-yellow-400/10"
              style={{
                left: `${regions.communityCards.x * 100}%`,
                top: `${regions.communityCards.y * 100}%`,
                width: `${regions.communityCards.width * 100}%`,
                height: `${regions.communityCards.height * 100}%`,
              }}
            >
              <span className="absolute -top-5 left-0 text-xs bg-yellow-400 text-black px-1 rounded">
                Community Cards
              </span>
            </div>

            {/* Pot Region */}
            <div
              className="absolute border-2 border-green-400 bg-green-400/10"
              style={{
                left: `${regions.pot.x * 100}%`,
                top: `${regions.pot.y * 100}%`,
                width: `${regions.pot.width * 100}%`,
                height: `${regions.pot.height * 100}%`,
              }}
            >
              <span className="absolute -top-5 left-0 text-xs bg-green-400 text-black px-1 rounded">
                Pot
              </span>
            </div>

            {/* Hero Cards Region */}
            <div
              className="absolute border-2 border-blue-400 bg-blue-400/10"
              style={{
                left: `${regions.heroCards.x * 100}%`,
                top: `${regions.heroCards.y * 100}%`,
                width: `${regions.heroCards.width * 100}%`,
                height: `${regions.heroCards.height * 100}%`,
              }}
            >
              <span className="absolute -top-5 left-0 text-xs bg-blue-400 text-black px-1 rounded">
                Hero Cards
              </span>
            </div>

            {/* Player Regions */}
            {regions.players.map((player, i) => (
              <div
                key={i}
                className="absolute border-2 border-purple-400 bg-purple-400/10"
                style={{
                  left: `${player.x * 100}%`,
                  top: `${player.y * 100}%`,
                  width: `${player.width * 100}%`,
                  height: `${player.height * 100}%`,
                }}
              >
                <span className="absolute -top-4 left-0 text-xs bg-purple-400 text-black px-1 rounded">
                  Seat {player.seatNumber}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Region Legend */}
      <div className="grid grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-400 bg-yellow-400/20"></div>
          <span className="text-sm text-slate-300">Community Cards</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-400 bg-green-400/20"></div>
          <span className="text-sm text-slate-300">Pot</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 bg-blue-400/20"></div>
          <span className="text-sm text-slate-300">Hero Cards</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-400 bg-purple-400/20"></div>
          <span className="text-sm text-slate-300">Player Seats</span>
        </div>
      </div>

      {/* Extracted Region Previews */}
      <ExtractedRegionsPreview />

      {/* Region Coordinates Reference */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Current Region Configuration (Ignition 6-max)</h4>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <span className="text-yellow-400">Community Cards:</span>
            <span className="text-slate-400 ml-2">
              x={regions.communityCards.x}, y={regions.communityCards.y}, 
              w={regions.communityCards.width}, h={regions.communityCards.height}
            </span>
          </div>
          <div>
            <span className="text-green-400">Pot:</span>
            <span className="text-slate-400 ml-2">
              x={regions.pot.x}, y={regions.pot.y}, 
              w={regions.pot.width}, h={regions.pot.height}
            </span>
          </div>
          <div>
            <span className="text-blue-400">Hero Cards:</span>
            <span className="text-slate-400 ml-2">
              x={regions.heroCards.x}, y={regions.heroCards.y}, 
              w={regions.heroCards.width}, h={regions.heroCards.height}
            </span>
          </div>
          <div>
            <span className="text-purple-400">Dealer:</span>
            <span className="text-slate-400 ml-2">
              x={regions.dealer.x}, y={regions.dealer.y}, 
              w={regions.dealer.width}, h={regions.dealer.height}
            </span>
          </div>
        </div>
      </div>

      {/* Calibration Instructions */}
      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-red-400 mb-2">Region Misalignment Detected</h4>
        <p className="text-sm text-red-200/80 mb-3">
          If the colored boxes don&apos;t align with your poker table elements, the regions need calibration. 
          The current coordinates are estimates for 1920x1080 resolution.
        </p>
        <ul className="text-sm text-red-200/80 list-disc list-inside space-y-1">
          <li>Use the <strong>Calibrate</strong> button in the Capture Control Panel</li>
          <li>Draw boxes around the actual card/pot/player regions</li>
          <li>Export the coordinates and update the site configuration</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Shows the actual extracted regions as images
 */
function ExtractedRegionsPreview() {
  const { capture } = useGameStore();
  const regionPreviews = capture.regionPreviews || [];

  if (regionPreviews.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 text-center text-slate-400">
        No region previews available. Start capture to see extracted regions.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-white">Extracted Region Images</h4>
      <p className="text-xs text-slate-400">
        These show exactly what the OCR sees. If you see green table felt instead of cards, the regions are misaligned.
      </p>
      <div className="grid grid-cols-3 gap-4">
        {regionPreviews.map((preview) => (
          <div key={preview.label} className="bg-slate-800 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white capitalize">
                {preview.label.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-xs text-slate-500">
                {preview.width}x{preview.height}
              </span>
            </div>
            <div className="bg-slate-900 rounded border border-slate-700 p-1">
              <img 
                src={preview.dataUrl} 
                alt={preview.label}
                className="w-full h-auto max-h-32 object-contain"
              />
            </div>
            {preview.label === 'communityCards' && (
              <p className="text-xs text-yellow-400 mt-2">
                Should show 5 white card faces (or empty table if preflop)
              </p>
            )}
            {preview.label === 'pot' && (
              <p className="text-xs text-green-400 mt-2">
                Should show pot amount text
              </p>
            )}
            {preview.label === 'heroCards' && (
              <p className="text-xs text-blue-400 mt-2">
                Should show your 2 hole cards
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FramePreviewTab({ frameDataUrl, isCapturing }: { frameDataUrl: string | null; isCapturing: boolean }) {
  if (!isCapturing && !frameDataUrl) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Capture Active</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Start screen capture to see the live frame preview here. The captured frames will be analyzed for cards, bets, and player information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Frame Preview */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Captured Frame
        </h3>
        {frameDataUrl ? (
          <div className="relative bg-slate-800 rounded-lg overflow-hidden">
            <img 
              src={frameDataUrl} 
              alt="Captured frame" 
              className="w-full h-auto max-h-[500px] object-contain"
            />
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              Live Preview
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Waiting for first frame...</p>
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-white mb-2">How It Works</h4>
        <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
          <li>This frame is captured from your shared screen at ~2 FPS</li>
          <li>Specific regions are cropped based on the poker site configuration</li>
          <li>OCR (Tesseract.js) extracts text: player names, stack sizes, pot amounts</li>
          <li>Card recognition attempts to identify cards by color and pattern</li>
          <li>Results are parsed into structured game state and update the dashboard</li>
        </ol>
      </div>

      {/* Current Limitations */}
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Current Limitations</h4>
        <ul className="text-sm text-yellow-200/80 space-y-1 list-disc list-inside">
          <li>Region coordinates are pre-defined for specific poker site layouts</li>
          <li>Card recognition works best with high-contrast, standard card designs</li>
          <li>No trained card templates yet - using basic color analysis</li>
          <li>OCR accuracy depends on text clarity and font style</li>
        </ul>
      </div>
    </div>
  );
}

function OCRResultsTab({ ocrResult }: { ocrResult: any }) {
  if (!ocrResult) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No OCR Results</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          The OCR pipeline hasn&apos;t produced any results yet. Make sure screen capture is running and pointed at a poker table.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard 
          label="Confidence" 
          value={`${(ocrResult.confidence * 100).toFixed(0)}%`}
          color={ocrResult.confidence > 0.7 ? 'green' : ocrResult.confidence > 0.4 ? 'yellow' : 'red'}
        />
        <StatCard label="Street" value={ocrResult.currentStreet || 'Unknown'} />
        <StatCard label="Pot" value={ocrResult.pot !== null ? `$${ocrResult.pot}` : 'Not detected'} />
        <StatCard label="Players Found" value={ocrResult.players?.length?.toString() || '0'} />
        <StatCard label="Cards Found" value={ocrResult.communityCards?.filter((c: any) => c.card)?.length?.toString() || '0'} />
      </div>

      {/* Community Cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Community Cards Detected
        </h3>
        <div className="flex gap-3">
          {ocrResult.communityCards && ocrResult.communityCards.length > 0 ? (
            ocrResult.communityCards.map((card: any, i: number) => (
              <div
                key={i}
                className={`w-20 h-28 rounded-lg flex flex-col items-center justify-center border-2 ${
                  card.card
                    ? 'bg-white border-emerald-500'
                    : card.isHidden
                    ? 'bg-blue-900 border-blue-600'
                    : 'bg-slate-700 border-slate-600'
                }`}
              >
                {card.card ? (
                  <>
                    <span className={`text-2xl font-bold ${
                      card.card.suit === 'hearts' || card.card.suit === 'diamonds' 
                        ? 'text-red-600' 
                        : 'text-slate-900'
                    }`}>
                      {card.card.rank}
                    </span>
                    <span className={`text-3xl ${
                      card.card.suit === 'hearts' || card.card.suit === 'diamonds' 
                        ? 'text-red-600' 
                        : 'text-slate-900'
                    }`}>
                      {card.card.suit === 'hearts' ? '♥' : 
                       card.card.suit === 'diamonds' ? '♦' : 
                       card.card.suit === 'clubs' ? '♣' : '♠'}
                    </span>
                  </>
                ) : card.isHidden ? (
                  <span className="text-blue-400 text-2xl">?</span>
                ) : (
                  <span className="text-slate-500 text-xl">Empty</span>
                )}
                <span className={`text-xs mt-2 ${
                  card.confidence > 0.8 ? 'text-emerald-600' : 
                  card.confidence > 0.5 ? 'text-yellow-600' : 
                  'text-red-500'
                }`}>
                  {(card.confidence * 100).toFixed(0)}% conf
                </span>
              </div>
            ))
          ) : (
            <div className="text-slate-500 text-sm p-4 bg-slate-800 rounded-lg">
              No community cards detected (preflop or not recognized)
            </div>
          )}
        </div>
      </div>

      {/* Players Detected */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Players Detected
        </h3>
        {ocrResult.players && ocrResult.players.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {ocrResult.players.map((player: any) => (
              <div
                key={player.seatNumber}
                className={`p-4 rounded-lg border ${
                  player.seatNumber === ocrResult.heroSeat
                    ? 'bg-emerald-900/30 border-emerald-600'
                    : player.isFolded
                    ? 'bg-slate-800/30 border-slate-700 opacity-50'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">Seat {player.seatNumber}</span>
                  <div className="flex gap-1">
                    {player.seatNumber === ocrResult.heroSeat && (
                      <span className="text-xs bg-emerald-600 text-white px-1.5 py-0.5 rounded">HERO</span>
                    )}
                    {player.isDealer && (
                      <span className="text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded">D</span>
                    )}
                    {player.isActive && (
                      <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Active</span>
                    )}
                  </div>
                </div>
                <div className="text-white font-medium">{player.name || '(Not detected)'}</div>
                <div className="text-sm text-slate-400 mt-1 space-y-0.5">
                  <div>Stack: <span className="text-white">{player.stack !== null ? `$${player.stack}` : '?'}</span></div>
                  <div>Bet: <span className="text-white">{player.currentBet !== null ? `$${player.currentBet}` : '-'}</span></div>
                </div>
                {player.cards && player.cards.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {player.cards.map((card: any, i: number) => (
                      <span
                        key={i}
                        className={`text-sm px-2 py-1 rounded font-medium ${
                          card.card 
                            ? 'bg-white text-slate-900' 
                            : card.isHidden 
                            ? 'bg-blue-800 text-blue-300' 
                            : 'bg-slate-700 text-slate-500'
                        }`}
                      >
                        {card.card 
                          ? `${card.card.rank}${card.card.suit[0].toUpperCase()}` 
                          : card.isHidden 
                          ? '?' 
                          : '-'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 text-sm p-4 bg-slate-800 rounded-lg">
            No players detected
          </div>
        )}
      </div>

      {/* Raw JSON */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Raw OCR Output
        </h3>
        <div className="bg-slate-800 rounded-lg p-4 font-mono text-xs max-h-64 overflow-auto">
          <pre className="text-slate-300 whitespace-pre-wrap">
            {JSON.stringify(ocrResult, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function GameStateTab({ hand, players }: { hand: any; players: any[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-white mb-2">About Game State</h4>
        <p className="text-sm text-slate-400">
          This shows the current state stored in the Zustand store. When OCR results are parsed successfully, 
          this data updates and triggers re-renders throughout the dashboard UI.
        </p>
      </div>

      {/* Hand State */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Hand State
        </h3>
        <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm">
          <pre className="text-slate-300 whitespace-pre-wrap">
            {JSON.stringify(hand, null, 2)}
          </pre>
        </div>
      </div>

      {/* Players State */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Players State ({players.length} players)
        </h3>
        <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
          <pre className="text-slate-300 whitespace-pre-wrap">
            {JSON.stringify(players, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: 'green' | 'yellow' | 'red' }) {
  const colorClasses = {
    green: 'text-emerald-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  };

  return (
    <div className="bg-slate-800 rounded-lg p-3 text-center">
      <div className={`text-lg font-bold ${color ? colorClasses[color] : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
