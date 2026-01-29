'use client';

import type { Card } from '@/types/poker';

interface WinningHandsProps {
  communityCards: Card[];
  heroCards: [Card, Card] | null;
}

interface HandProbability {
  name: string;
  probability: number;
  description: string;
  beatsHero: boolean;
}

export function WinningHands({ communityCards, heroCards }: WinningHandsProps) {
  // Mock data - in production this would be calculated
  const possibleHands: HandProbability[] = [
    { name: 'Royal Flush', probability: 0.001, description: 'A♠ K♠ Q♠ J♠ T♠', beatsHero: true },
    { name: 'Straight Flush', probability: 0.01, description: 'Five cards in sequence, same suit', beatsHero: true },
    { name: 'Four of a Kind', probability: 0.5, description: 'K-K-K-K possible', beatsHero: true },
    { name: 'Full House', probability: 2.1, description: 'K-K-K-7-7 or K-K-7-7-7', beatsHero: true },
    { name: 'Flush', probability: 4.2, description: 'Any five of same suit', beatsHero: true },
    { name: 'Straight', probability: 6.8, description: 'Five consecutive cards', beatsHero: true },
    { name: 'Three of a Kind', probability: 8.5, description: 'Set or trips possible', beatsHero: false },
    { name: 'Two Pair', probability: 15.2, description: 'K-K-7-7 or similar', beatsHero: false },
    { name: 'One Pair', probability: 32.4, description: 'You have this (K-K)', beatsHero: false },
    { name: 'High Card', probability: 30.3, description: 'No made hand', beatsHero: false },
  ];

  const betterHands = possibleHands.filter(h => h.beatsHero);
  const totalBeatsProbability = betterHands.reduce((sum, h) => sum + h.probability, 0);

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
        Possible Hands
      </h3>

      {/* Summary */}
      <div className="p-4 bg-gray-800/50 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">Hands That Beat You</div>
            <div className="text-2xl font-bold text-red-400">
              {totalBeatsProbability.toFixed(1)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Your Hand</div>
            <div className="text-lg font-semibold text-green-400">Top Pair, Top Kicker</div>
          </div>
        </div>
      </div>

      {/* Hand Rankings */}
      <div className="space-y-1">
        {possibleHands.map((hand) => (
          <div 
            key={hand.name}
            className={`p-2 rounded flex items-center justify-between text-sm ${
              hand.beatsHero ? 'bg-red-900/20' : 'bg-gray-800/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {hand.beatsHero ? (
                <span className="text-red-400">⚠️</span>
              ) : (
                <span className="text-green-400">✓</span>
              )}
              <span className={hand.beatsHero ? 'text-red-300' : 'text-gray-300'}>
                {hand.name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">{hand.description}</span>
              <span className={`font-mono ${hand.beatsHero ? 'text-red-400' : 'text-gray-400'}`}>
                {hand.probability.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Danger Cards */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-xs font-semibold text-gray-500 mb-2">Danger Cards on Turn/River</h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-red-900/30 border border-red-700 rounded text-xs text-red-300">
            Any ♠ (Flush)
          </span>
          <span className="px-2 py-1 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-300">
            K, 7, 2 (Trips/Set)
          </span>
          <span className="px-2 py-1 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-300">
            A (Higher Pair)
          </span>
          <span className="px-2 py-1 bg-orange-900/30 border border-orange-700 rounded text-xs text-orange-300">
            3, 4, 5, 6 (Straight)
          </span>
        </div>
      </div>

      {/* Safe Cards */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-gray-500 mb-2">Safe Cards</h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-green-900/30 border border-green-700 rounded text-xs text-green-300">
            8, 9, T, J, Q (Blanks)
          </span>
        </div>
      </div>
    </div>
  );
}
