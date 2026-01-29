'use client';

/**
 * Player Tracking Panel
 * Displays all seats at the table with current occupants and behavioral stats
 */

import { useState } from 'react';
import type { SeatState, PlayerChange } from '@/lib/tracking/playerTracker';

interface PlayerTrackingPanelProps {
  maxSeats?: number;
  isAnonymous?: boolean;
  onSelectPlayer?: (playerId: string | null, seatNumber: number) => void;
}

// Mock seat data for development (will be replaced by real tracker)
const createMockSeats = (maxSeats: number): SeatState[] => {
  return Array.from({ length: maxSeats }, (_, i) => ({
    seatNumber: i + 1,
    isOccupied: Math.random() > 0.3,
    playerName: null,
    stackSize: Math.random() > 0.3 ? Math.floor(Math.random() * 500 + 50) : null,
    lastSeenStackSize: null,
    currentPlayerId: Math.random() > 0.3 ? crypto.randomUUID() : null,
    isSittingOut: Math.random() > 0.9,
    lastAction: ['fold', 'call', 'raise', 'check', null][Math.floor(Math.random() * 5)],
    lastActionTime: Date.now() - Math.floor(Math.random() * 60000),
  }));
};

// Mock player stats
interface PlayerStats {
  vpip: number;
  pfr: number;
  threeBet: number;
  af: number;
  handsPlayed: number;
}

const generateMockStats = (): PlayerStats => ({
  vpip: Math.floor(Math.random() * 40 + 10),
  pfr: Math.floor(Math.random() * 30 + 5),
  threeBet: Math.floor(Math.random() * 15 + 2),
  af: Math.random() * 3 + 0.5,
  handsPlayed: Math.floor(Math.random() * 100 + 10),
});

export function PlayerTrackingPanel({
  maxSeats = 6,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isAnonymous = true,
  onSelectPlayer,
}: PlayerTrackingPanelProps) {
  // Initialize state with mock data using initializer functions
  const [seats] = useState<SeatState[]>(() => createMockSeats(maxSeats));
  
  const [playerStats] = useState<Map<string, PlayerStats>>(() => {
    const mockSeats = createMockSeats(maxSeats);
    const stats = new Map<string, PlayerStats>();
    mockSeats.forEach(seat => {
      if (seat.currentPlayerId) {
        stats.set(seat.currentPlayerId, generateMockStats());
      }
    });
    return stats;
  });
  
  const [recentChanges] = useState<PlayerChange[]>(() => {
    const now = Date.now();
    return [
      {
        type: 'join',
        seatNumber: 3,
        previousPlayerId: null,
        newPlayerId: 'abc123',
        timestamp: now - 120000,
        details: { newStack: 200 },
      },
      {
        type: 'leave',
        seatNumber: 5,
        previousPlayerId: 'def456',
        newPlayerId: null,
        timestamp: now - 300000,
        details: { previousStack: 0 },
      },
    ];
  });
  
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSeatClick = (seat: SeatState) => {
    setSelectedSeat(seat.seatNumber === selectedSeat ? null : seat.seatNumber);
    if (onSelectPlayer) {
      onSelectPlayer(seat.currentPlayerId, seat.seatNumber);
    }
  };

  const getPositionLabel = (seatNumber: number, heroSeat: number = 1): string => {
    const positions6 = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];
    const positions9 = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO'];
    const positions = maxSeats === 6 ? positions6 : positions9;
    
    // Calculate relative position from hero
    const relativePos = (seatNumber - heroSeat + maxSeats) % maxSeats;
    return positions[relativePos] || `S${seatNumber}`;
  };

  const getPlayerTypeColor = (stats: PlayerStats | undefined): string => {
    if (!stats) return 'bg-slate-600';
    
    // Classify player type
    if (stats.vpip < 18 && stats.pfr < 15) return 'bg-blue-600'; // Nit
    if (stats.vpip < 25 && stats.pfr > 18) return 'bg-green-600'; // TAG
    if (stats.vpip > 35 && stats.pfr > 25) return 'bg-orange-600'; // LAG
    if (stats.vpip > 40 && stats.pfr < 15) return 'bg-red-600'; // Fish
    return 'bg-slate-600'; // Unknown
  };

  const getPlayerTypeLabel = (stats: PlayerStats | undefined): string => {
    if (!stats || stats.handsPlayed < 20) return 'Unknown';
    
    if (stats.vpip < 18 && stats.pfr < 15) return 'Nit';
    if (stats.vpip < 25 && stats.pfr > 18) return 'TAG';
    if (stats.vpip > 35 && stats.pfr > 25) return 'LAG';
    if (stats.vpip > 40 && stats.pfr < 15) return 'Fish';
    if (stats.af > 3) return 'Maniac';
    return 'Reg';
  };

  // Use a stable timestamp reference for formatting
  const [now] = useState(() => Date.now());
  
  const formatTime = (timestamp: number): string => {
    const diff = now - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-white">Table Seats</h3>
          <span className="text-xs text-slate-500">
            {seats.filter(s => s.isOccupied && !s.isSittingOut).length}/{maxSeats} Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Seats Display */}
      <div className="p-4">
        {viewMode === 'grid' ? (
          <div className={`grid gap-3 ${maxSeats === 6 ? 'grid-cols-3' : 'grid-cols-3'}`}>
            {seats.map(seat => {
              const stats = seat.currentPlayerId ? playerStats.get(seat.currentPlayerId) : undefined;
              const isSelected = selectedSeat === seat.seatNumber;
              
              return (
                <button
                  key={seat.seatNumber}
                  onClick={() => handleSeatClick(seat)}
                  className={`relative p-3 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : seat.isOccupied
                      ? 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      : 'border-slate-700/50 bg-slate-800/30'
                  } ${seat.isSittingOut ? 'opacity-50' : ''}`}
                >
                  {/* Position Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">
                      {getPositionLabel(seat.seatNumber)}
                    </span>
                    {seat.isOccupied && (
                      <span className={`w-2 h-2 rounded-full ${
                        seat.isSittingOut ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                    )}
                  </div>

                  {seat.isOccupied ? (
                    <>
                      {/* Player Name/ID */}
                      <div className="font-medium text-white text-sm truncate mb-1">
                        {seat.playerName || `Seat ${seat.seatNumber}`}
                      </div>

                      {/* Stack */}
                      <div className="text-emerald-400 font-mono text-sm mb-2">
                        ${seat.stackSize?.toLocaleString() ?? '—'}
                      </div>

                      {/* Player Type Badge */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getPlayerTypeColor(stats)}`}>
                          {getPlayerTypeLabel(stats)}
                        </span>
                        {stats && stats.handsPlayed >= 20 && (
                          <span className="text-xs text-slate-500">
                            {stats.handsPlayed}h
                          </span>
                        )}
                      </div>

                      {/* Last Action */}
                      {seat.lastAction && (
                        <div className="mt-2 text-xs text-slate-500 capitalize">
                          {seat.lastAction}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-4 text-center">
                      <span className="text-slate-600 text-sm">Empty</span>
                    </div>
                  )}

                  {/* Hero Indicator */}
                  {seat.seatNumber === 1 && (
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      HERO
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {seats.map(seat => {
              const stats = seat.currentPlayerId ? playerStats.get(seat.currentPlayerId) : undefined;
              const isSelected = selectedSeat === seat.seatNumber;
              
              return (
                <button
                  key={seat.seatNumber}
                  onClick={() => handleSeatClick(seat)}
                  className={`w-full flex items-center gap-4 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : seat.isOccupied
                      ? 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      : 'border-slate-700/50 bg-slate-800/30'
                  } ${seat.isSittingOut ? 'opacity-50' : ''}`}
                >
                  {/* Seat Number */}
                  <div className="w-12 text-center">
                    <div className="text-xs text-slate-500">Seat</div>
                    <div className="text-lg font-bold text-white">{seat.seatNumber}</div>
                  </div>

                  {/* Position */}
                  <div className="w-12 text-center">
                    <span className="text-xs font-medium text-slate-400 bg-slate-700 px-2 py-1 rounded">
                      {getPositionLabel(seat.seatNumber)}
                    </span>
                  </div>

                  {seat.isOccupied ? (
                    <>
                      {/* Player Info */}
                      <div className="flex-1 text-left">
                        <div className="font-medium text-white text-sm">
                          {seat.playerName || `Player ${seat.seatNumber}`}
                          {seat.seatNumber === 1 && (
                            <span className="ml-2 text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                              HERO
                            </span>
                          )}
                        </div>
                        {stats && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            VPIP: {stats.vpip}% | PFR: {stats.pfr}% | AF: {stats.af.toFixed(1)}
                          </div>
                        )}
                      </div>

                      {/* Stack */}
                      <div className="text-right">
                        <div className="text-emerald-400 font-mono font-medium">
                          ${seat.stackSize?.toLocaleString() ?? '—'}
                        </div>
                        <div className={`text-xs mt-0.5 px-2 py-0.5 rounded inline-block ${getPlayerTypeColor(stats)} text-white`}>
                          {getPlayerTypeLabel(stats)}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="w-20 text-right">
                        {seat.isSittingOut ? (
                          <span className="text-xs text-yellow-500">Sitting Out</span>
                        ) : seat.lastAction ? (
                          <span className="text-xs text-slate-400 capitalize">{seat.lastAction}</span>
                        ) : (
                          <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 text-slate-600 text-sm">
                      Empty seat
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Changes */}
      {recentChanges.length > 0 && (
        <div className="px-4 pb-4">
          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Recent Changes
            </h4>
            <div className="space-y-1">
              {recentChanges.slice(0, 3).map((change, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    change.type === 'join' ? 'bg-green-500' :
                    change.type === 'leave' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <span className="text-slate-400">
                    Seat {change.seatNumber}:
                  </span>
                  <span className={`font-medium ${
                    change.type === 'join' ? 'text-green-400' :
                    change.type === 'leave' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {change.type === 'join' ? 'Player joined' :
                     change.type === 'leave' ? 'Player left' :
                     'Player returned'}
                  </span>
                  {change.details.newStack && (
                    <span className="text-slate-500">
                      (${change.details.newStack})
                    </span>
                  )}
                  <span className="text-slate-600 ml-auto">
                    {formatTime(change.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Player Details */}
      {selectedSeat && (
        <SelectedPlayerDetails
          seat={seats.find(s => s.seatNumber === selectedSeat)!}
          stats={seats.find(s => s.seatNumber === selectedSeat)?.currentPlayerId 
            ? playerStats.get(seats.find(s => s.seatNumber === selectedSeat)!.currentPlayerId!)
            : undefined}
          onClose={() => setSelectedSeat(null)}
        />
      )}
    </div>
  );
}

/**
 * Selected Player Details Panel
 */
function SelectedPlayerDetails({
  seat,
  stats,
  onClose,
}: {
  seat: SeatState;
  stats?: PlayerStats;
  onClose: () => void;
}) {
  if (!seat.isOccupied) return null;

  return (
    <div className="border-t border-slate-800 p-4 bg-slate-800/50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-white">
          {seat.playerName || `Seat ${seat.seatNumber}`} Details
        </h4>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {stats ? (
        <div className="grid grid-cols-4 gap-3">
          <StatBox label="VPIP" value={`${stats.vpip}%`} color="blue" />
          <StatBox label="PFR" value={`${stats.pfr}%`} color="green" />
          <StatBox label="3-Bet" value={`${stats.threeBet}%`} color="yellow" />
          <StatBox label="AF" value={stats.af.toFixed(1)} color="orange" />
        </div>
      ) : (
        <div className="text-sm text-slate-500 text-center py-4">
          Not enough hands to display stats (need 20+)
        </div>
      )}

      {stats && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Hands tracked: {stats.handsPlayed}</span>
            <span>Sample: {stats.handsPlayed < 50 ? 'Small' : stats.handsPlayed < 100 ? 'Medium' : 'Large'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    orange: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className={`rounded-lg p-2 text-center ${colors[color] || colors.blue}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  );
}

export default PlayerTrackingPanel;
