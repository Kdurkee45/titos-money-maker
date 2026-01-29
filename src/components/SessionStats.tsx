'use client';

import type { HandHistoryEntry } from '@/types/poker';

interface SessionStatsProps {
  handHistory: HandHistoryEntry[];
  sessionProfit: number;
  handsPlayed: number;
}

export function SessionStats({ handHistory, sessionProfit, handsPlayed }: SessionStatsProps) {
  const wins = handHistory.filter(h => h.result === 'won').length;
  const losses = handHistory.filter(h => h.result === 'lost').length;
  const folds = handHistory.filter(h => h.result === 'folded').length;
  const showdowns = handHistory.filter(h => h.showdown).length;
  const totalPnL = handHistory.reduce((sum, h) => sum + h.profit, 0);

  // Calculate running total for chart
  const chartData = handHistory.slice().reverse().reduce((acc, hand, i) => {
    const prev = acc[i - 1]?.total || 0;
    acc.push({ hand: hand.handNumber, total: prev + hand.profit });
    return acc;
  }, [] as { hand: number; total: number }[]);

  const maxProfit = Math.max(...chartData.map(d => d.total), 0);
  const minProfit = Math.min(...chartData.map(d => d.total), 0);
  const range = maxProfit - minProfit || 1;

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
        Session Overview
      </h3>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-800/50 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-400">
            {sessionProfit >= 0 ? '+' : ''}{sessionProfit}
          </div>
          <div className="text-xs text-gray-500 mt-1">Session P/L (BB)</div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-lg text-center">
          <div className="text-3xl font-bold">{handsPlayed}</div>
          <div className="text-xs text-gray-500 mt-1">Hands Played</div>
        </div>
      </div>

      {/* Win/Loss Breakdown */}
      <div className="grid grid-cols-4 gap-2 mb-6 text-center text-sm">
        <div className="p-2 bg-green-900/30 rounded">
          <div className="font-bold text-green-400">{wins}</div>
          <div className="text-xs text-gray-500">Wins</div>
        </div>
        <div className="p-2 bg-red-900/30 rounded">
          <div className="font-bold text-red-400">{losses}</div>
          <div className="text-xs text-gray-500">Losses</div>
        </div>
        <div className="p-2 bg-gray-800/50 rounded">
          <div className="font-bold text-gray-400">{folds}</div>
          <div className="text-xs text-gray-500">Folds</div>
        </div>
        <div className="p-2 bg-blue-900/30 rounded">
          <div className="font-bold text-blue-400">{showdowns}</div>
          <div className="text-xs text-gray-500">Showdowns</div>
        </div>
      </div>

      {/* Simple Chart */}
      {chartData.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">Profit Graph</h4>
          <div className="h-24 flex items-end gap-0.5 bg-gray-800/30 rounded p-2">
            {chartData.map((point, i) => {
              const height = ((point.total - minProfit) / range) * 100;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition-all ${
                    point.total >= 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`Hand #${point.hand}: ${point.total >= 0 ? '+' : ''}${point.total}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Earlier</span>
            <span>Recent</span>
          </div>
        </div>
      )}

      {/* Recent Hands */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 mb-2">Recent Hands</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {handHistory.slice(0, 5).map((hand) => (
            <div 
              key={hand.handNumber} 
              className={`p-2 rounded text-sm flex items-center justify-between ${
                hand.result === 'won' ? 'bg-green-900/20' :
                hand.result === 'lost' ? 'bg-red-900/20' :
                'bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500">#{hand.handNumber}</span>
                <span className="font-mono text-xs">
                  {hand.heroCards[0].rank}{hand.heroCards[0].suit.charAt(0)}
                  {hand.heroCards[1].rank}{hand.heroCards[1].suit.charAt(0)}
                </span>
              </div>
              <span className={`font-semibold ${
                hand.profit >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {hand.profit >= 0 ? '+' : ''}{hand.profit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
