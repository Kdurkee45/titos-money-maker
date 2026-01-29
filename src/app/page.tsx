'use client';

import { useState } from 'react';
import {
  PokerTable,
  PlayerCard,
  EquityDisplay,
  HandStrengthDisplay,
  GTORecommendation,
  RangeMatrix,
  PlayerStats,
  BoardAnalysis,
  ActionPanel,
  SessionStats,
  WinningHands,
  Alerts,
  CaptureControlPanel,
  CaptureDebugPanel,
  CalibrationTool,
  PlayerTrackingPanel,
  ElectronCapturePanel,
} from '@/components';
import { isElectron } from '@/lib/capture/electronCapture';
import { AuthGuard, useAuthContext } from '@/components/auth';
import {
  mockGameState,
  mockEquity,
  mockPotOdds,
  mockHandStrength,
  mockBoardTexture,
  mockDraws,
  mockGTORecommendation,
  mockHandHistory,
  mockOpponentRange,
} from '@/data/mockData';

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user, signOut } = useAuthContext();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCapturePanel, setShowCapturePanel] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [playerViewMode, setPlayerViewMode] = useState<'cards' | 'tracking'>('tracking');
  const [activeTab, setActiveTab] = useState<'analysis' | 'ranges' | 'history'>('analysis');
  // Check if running in Electron - use initializer function to avoid effect
  const [isElectronApp] = useState(() => {
    // This runs only once during initialization
    if (typeof window !== 'undefined') {
      return isElectron();
    }
    return false;
  });
  
  const [alerts, setAlerts] = useState(() => [
    {
      id: '1',
      type: 'success' as const,
      title: 'Premium Hand Detected',
      message: 'AKs is a top 2% starting hand. Consider 3-betting for value.',
      timestamp: Date.now(),
      dismissed: false,
    },
  ]);

  const selectedPlayer = selectedPlayerId 
    ? mockGameState.players.find(p => p.id === selectedPlayerId) 
    : null;

  const hero = mockGameState.players.find(p => p.isHero);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[var(--bg-secondary)]">
        <div className="max-w-[1920px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                GTO Poker Pro
              </h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-gray-300">Live</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="text-gray-400">Table: </span>
                <span className="font-semibold">{mockGameState.tableName}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Stakes: </span>
                <span className="font-semibold text-green-400">{mockGameState.stakes}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Hand #</span>
                <span className="font-semibold">{mockGameState.handNumber}</span>
              </div>
              <div className="px-3 py-1 bg-blue-600 rounded text-sm font-semibold uppercase">
                {mockGameState.street}
              </div>

              {/* Capture Toggle */}
              <button
                onClick={() => setShowCapturePanel(!showCapturePanel)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  showCapturePanel 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Capture</span>
                {isElectronApp && (
                  <span className="text-xs bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded">
                    Native
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm font-medium text-white truncate">
                          {user?.user_metadata?.username || 'Player'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            signOut();
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700/50 transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Capture Panel Slide-out */}
      {showCapturePanel && (
        <div className="fixed top-16 right-4 z-50 w-96">
          {isElectronApp ? (
            <ElectronCapturePanel 
              onOpenDebug={() => setShowDebugPanel(true)} 
            />
          ) : (
            <CaptureControlPanel 
              onOpenDebug={() => setShowDebugPanel(true)} 
              onOpenCalibration={() => setShowCalibration(true)}
            />
          )}
        </div>
      )}

      {/* Debug Panel Modal */}
      <CaptureDebugPanel 
        isOpen={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />

      {/* Calibration Tool */}
      <CalibrationTool
        isOpen={showCalibration}
        onClose={() => setShowCalibration(false)}
      />

      <div className="max-w-[1920px] mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          
          {/* Left Sidebar - Player Tracking */}
          <div className="col-span-3 space-y-3">
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                {playerViewMode === 'tracking' ? 'Table Seats' : 'Players'}
              </h2>
              <div className="flex bg-gray-800 rounded-lg p-0.5">
                <button
                  onClick={() => setPlayerViewMode('tracking')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    playerViewMode === 'tracking' 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Seats
                </button>
                <button
                  onClick={() => setPlayerViewMode('cards')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    playerViewMode === 'cards' 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Cards
                </button>
              </div>
            </div>

            {/* Player Content */}
            {playerViewMode === 'tracking' ? (
              <PlayerTrackingPanel
                maxSeats={6}
                isAnonymous={true}
                onSelectPlayer={(playerId, seatNumber) => {
                  setSelectedPlayerId(playerId);
                  setSelectedSeat(seatNumber);
                }}
              />
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                {mockGameState.players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    compact
                    isSelected={selectedPlayerId === player.id}
                    onSelect={() => setSelectedPlayerId(
                      selectedPlayerId === player.id ? null : player.id
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Center - Table and Action */}
          <div className="col-span-6 space-y-4">
            {/* Poker Table */}
            <div className="card card-elevated p-0 overflow-hidden">
              <PokerTable
                players={mockGameState.players}
                communityCards={mockGameState.communityCards}
                pot={mockGameState.pot}
                activePlayerId={mockGameState.activePlayerId}
                dealerPosition={mockGameState.dealerPosition}
                selectedPlayerId={selectedPlayerId}
                onPlayerClick={setSelectedPlayerId}
              />
            </div>

            {/* Action Panel & Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <ActionPanel
                  pot={mockGameState.pot}
                  toCall={mockGameState.currentBet}
                  minRaise={mockGameState.minRaise}
                  stack={hero?.stack || 0}
                />
              </div>
              <div>
                <EquityDisplay equity={mockEquity} potOdds={mockPotOdds} />
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-700 pb-2">
              {(['analysis', 'ranges', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-semibold rounded-t transition-colors ${
                    activeTab === tab
                      ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-2 gap-4">
              {activeTab === 'analysis' && (
                <>
                  <GTORecommendation recommendation={mockGTORecommendation} />
                  <WinningHands 
                    communityCards={mockGameState.communityCards}
                    heroCards={hero?.holeCards || null}
                  />
                </>
              )}
              {activeTab === 'ranges' && (
                <>
                  <RangeMatrix 
                    range={mockOpponentRange} 
                    title="BigStack_Dan's Estimated 3-Bet Range"
                  />
                  <div className="space-y-4">
                    <div className="card">
                      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                        Range Analysis
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Combos in Range:</span>
                          <span className="font-semibold">42</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">% of All Hands:</span>
                          <span className="font-semibold">3.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Your Equity vs Range:</span>
                          <span className="font-semibold text-yellow-400">48.2%</span>
                        </div>
                      </div>
                    </div>
                    <div className="card">
                      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                        Range Composition
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded" />
                          <span className="flex-1">Premium Pairs (AA-TT)</span>
                          <span>45%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded" />
                          <span className="flex-1">Broadway (AK, AQ, AJ)</span>
                          <span>35%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded" />
                          <span className="flex-1">Suited Connectors</span>
                          <span>15%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500 rounded" />
                          <span className="flex-1">Other</span>
                          <span>5%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {activeTab === 'history' && (
                <>
                  <SessionStats
                    handHistory={mockHandHistory}
                    sessionProfit={580}
                    handsPlayed={89}
                  />
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                      Performance Metrics
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Win Rate</span>
                          <span className="text-green-400 font-semibold">+12.5 BB/100</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full bg-green-500 w-3/4" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Showdown Win %</span>
                          <span className="font-semibold">62%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full bg-blue-500 w-[62%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Non-Showdown Win %</span>
                          <span className="font-semibold">54%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full bg-purple-500 w-[54%]" />
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Stats</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2 bg-gray-800/50 rounded">
                            <div className="text-gray-500 text-xs">VPIP</div>
                            <div className="font-semibold">22%</div>
                          </div>
                          <div className="p-2 bg-gray-800/50 rounded">
                            <div className="text-gray-500 text-xs">PFR</div>
                            <div className="font-semibold">18%</div>
                          </div>
                          <div className="p-2 bg-gray-800/50 rounded">
                            <div className="text-gray-500 text-xs">3-Bet</div>
                            <div className="font-semibold">8%</div>
                          </div>
                          <div className="p-2 bg-gray-800/50 rounded">
                            <div className="text-gray-500 text-xs">Aggression</div>
                            <div className="font-semibold">2.4</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Sidebar - Selected Player Stats & Analysis */}
          <div className="col-span-3 space-y-4">
            {selectedPlayer ? (
              <>
                <PlayerStats player={selectedPlayer} />
                {!selectedPlayer.isHero && (
                  <RangeMatrix 
                    range={mockOpponentRange} 
                    title={`${selectedPlayer.name}'s Range`}
                  />
                )}
              </>
            ) : (
              <>
                <HandStrengthDisplay 
                  handStrength={mockHandStrength} 
                  draws={mockDraws}
                />
                <BoardAnalysis 
                  communityCards={mockGameState.communityCards}
                  boardTexture={mockBoardTexture}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <Alerts alerts={alerts} onDismiss={dismissAlert} />
    </div>
  );
}
