'use client';

import type { Player } from '@/types/poker';

interface PlayerStatsProps {
  player: Player;
}

interface StatRowProps {
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  tooltip?: string;
}

function StatRow({ label, value, subValue, color = 'text-white' }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <div className="text-right">
        <span className={`font-semibold ${color}`}>{value}</span>
        {subValue && <span className="text-xs text-gray-500 ml-1">{subValue}</span>}
      </div>
    </div>
  );
}

export function PlayerStats({ player }: PlayerStatsProps) {
  const { stats } = player;
  
  const getVPIPColor = (vpip: number) => {
    if (vpip < 15) return 'text-blue-400'; // Tight
    if (vpip < 25) return 'text-green-400'; // Normal
    if (vpip < 35) return 'text-yellow-400'; // Loose
    return 'text-red-400'; // Very loose
  };

  const getPFRColor = (pfr: number) => {
    if (pfr < 10) return 'text-blue-400'; // Passive
    if (pfr < 20) return 'text-green-400'; // Normal
    if (pfr < 30) return 'text-yellow-400'; // Aggressive
    return 'text-red-400'; // Very aggressive
  };

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
        Detailed Statistics
      </h3>

      {/* Player Info */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-800/50 rounded-lg">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ backgroundColor: player.colorLabel || '#374151' }}
        >
          {player.name.charAt(0)}
        </div>
        <div>
          <div className="font-semibold">{player.name}</div>
          <div className="text-sm text-gray-400">{stats.handsPlayed.toLocaleString()} hands tracked</div>
        </div>
      </div>

      {/* Pre-flop Stats */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Pre-Flop</h4>
        <StatRow label="VPIP" value={`${stats.vpip}%`} color={getVPIPColor(stats.vpip)} />
        <StatRow label="PFR" value={`${stats.pfr}%`} color={getPFRColor(stats.pfr)} />
        <StatRow label="3-Bet" value={`${stats.threeBet}%`} />
        <StatRow label="Fold to 3-Bet" value={`${stats.foldToThreeBet}%`} />
      </div>

      {/* Post-flop Stats */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Post-Flop</h4>
        <StatRow label="Aggression Factor" value={stats.aggression.toFixed(1)} />
        <StatRow label="C-Bet" value={`${stats.cbet}%`} />
        <StatRow label="Fold to C-Bet" value={`${stats.foldToCbet}%`} />
        <StatRow label="WTSD" value={`${stats.wtsd}%`} subValue="Went to Showdown" />
        <StatRow label="W$SD" value={`${stats.wsd}%`} subValue="Won at Showdown" />
      </div>

      {/* Betting Patterns */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Betting Patterns</h4>
        <StatRow label="Avg Bet Size" value={`${stats.avgBetSize}x BB`} />
        <StatRow label="Avg Raise" value={`${stats.avgRaiseSize}x`} />
        <StatRow 
          label="Est. Bluff Freq" 
          value={`${stats.bluffFrequency}%`} 
          color={stats.bluffFrequency > 40 ? 'text-red-400' : stats.bluffFrequency > 25 ? 'text-yellow-400' : 'text-green-400'}
        />
      </div>

      {/* Position Stats */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">By Position</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-gray-800/50 rounded">
            <div className="text-gray-400 text-xs mb-1">Early</div>
            <div>VPIP: {stats.positionStats.early.vpip}%</div>
            <div>PFR: {stats.positionStats.early.pfr}%</div>
          </div>
          <div className="p-2 bg-gray-800/50 rounded">
            <div className="text-gray-400 text-xs mb-1">Middle</div>
            <div>VPIP: {stats.positionStats.middle.vpip}%</div>
            <div>PFR: {stats.positionStats.middle.pfr}%</div>
          </div>
          <div className="p-2 bg-gray-800/50 rounded">
            <div className="text-gray-400 text-xs mb-1">Late</div>
            <div>VPIP: {stats.positionStats.late.vpip}%</div>
            <div>PFR: {stats.positionStats.late.pfr}%</div>
          </div>
          <div className="p-2 bg-gray-800/50 rounded">
            <div className="text-gray-400 text-xs mb-1">Blinds</div>
            <div>VPIP: {stats.positionStats.blinds.vpip}%</div>
            <div>PFR: {stats.positionStats.blinds.pfr}%</div>
          </div>
        </div>
      </div>

      {/* Session Stats */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">This Session</h4>
        <StatRow 
          label="Profit/Loss" 
          value={`${stats.sessionProfit >= 0 ? '+' : ''}$${stats.sessionProfit}`}
          color={stats.sessionProfit >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatRow label="Hands" value={stats.sessionHands} />
        <StatRow label="Biggest Pot" value={`$${stats.biggestPot}`} />
        <StatRow 
          label="Win Rate" 
          value={`${stats.winRate >= 0 ? '+' : ''}${stats.winRate} BB/100`}
          color={stats.winRate >= 0 ? 'text-green-400' : 'text-red-400'}
        />
      </div>
    </div>
  );
}
