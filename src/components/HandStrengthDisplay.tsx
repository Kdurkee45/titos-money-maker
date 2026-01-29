'use client';

import type { HandStrength, DrawInfo } from '@/types/poker';

interface HandStrengthDisplayProps {
  handStrength: HandStrength;
  draws?: DrawInfo[];
}

const rankingColors: Record<string, string> = {
  'high-card': 'text-gray-400',
  'pair': 'text-blue-400',
  'two-pair': 'text-blue-500',
  'three-of-a-kind': 'text-green-400',
  'straight': 'text-green-500',
  'flush': 'text-purple-400',
  'full-house': 'text-purple-500',
  'four-of-a-kind': 'text-yellow-400',
  'straight-flush': 'text-yellow-500',
  'royal-flush': 'text-red-400',
};

export function HandStrengthDisplay({ handStrength, draws = [] }: HandStrengthDisplayProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
        Hand Strength
      </h3>

      {/* Current Hand */}
      <div className="mb-4">
        <div className={`text-xl font-bold ${rankingColors[handStrength.ranking]}`}>
          {handStrength.rankingName}
        </div>
        <p className="text-sm text-gray-400 mt-1">{handStrength.description}</p>
      </div>

      {/* Strength Meter */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Weak</span>
          <span>Strong</span>
        </div>
        <div className="hand-strength">
          <div 
            className="hand-strength-marker"
            style={{ left: `${handStrength.percentile}%` }}
          />
        </div>
        <div className="text-center text-sm mt-2">
          <span className="text-gray-400">Top </span>
          <span className="font-bold text-white">{(100 - handStrength.percentile).toFixed(0)}%</span>
          <span className="text-gray-400"> of all hands</span>
        </div>
      </div>

      {/* Draws */}
      {draws.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Available Draws</h4>
          <div className="space-y-2">
            {draws.map((draw, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {draw.type === 'flush' ? '♠' : 
                     draw.type === 'straight' ? '📊' : 
                     draw.type === 'gutshot' ? '🎯' : '🃏'}
                  </span>
                  <span className="capitalize">{draw.type} Draw</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-400">{draw.outs} outs</div>
                  <div className="text-xs text-gray-400">{draw.probability}% by river</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
