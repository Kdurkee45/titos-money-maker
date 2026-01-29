'use client';

import type { BoardTexture, Card } from '@/types/poker';
import { CardGroup } from './PokerCard';

interface BoardAnalysisProps {
  communityCards: Card[];
  boardTexture: BoardTexture | null;
}

export function BoardAnalysis({ communityCards, boardTexture }: BoardAnalysisProps) {
  if (communityCards.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
          Board Analysis
        </h3>
        <div className="text-center py-8 text-gray-500">
          Waiting for flop...
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
        Board Analysis
      </h3>

      {/* Community Cards */}
      <div className="flex justify-center mb-4">
        <CardGroup cards={communityCards} size="md" />
      </div>

      {boardTexture && (
        <>
          {/* Board Texture */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Texture</div>
              <div className={`font-semibold capitalize ${
                boardTexture.texture === 'dry' ? 'text-green-400' :
                boardTexture.texture === 'wet' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {boardTexture.texture}
              </div>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Danger Level</div>
              <div className={`font-semibold capitalize ${
                boardTexture.dangerLevel === 'low' ? 'text-green-400' :
                boardTexture.dangerLevel === 'high' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {boardTexture.dangerLevel}
              </div>
            </div>
          </div>

          {/* Board Characteristics */}
          <div className="flex flex-wrap gap-2 mb-4">
            {boardTexture.isPaired && (
              <span className="stat-badge text-yellow-400 border border-yellow-600">
                Paired
              </span>
            )}
            {boardTexture.isMonotone && (
              <span className="stat-badge text-red-400 border border-red-600">
                Monotone
              </span>
            )}
            {boardTexture.isTwoTone && (
              <span className="stat-badge text-orange-400 border border-orange-600">
                Two-Tone
              </span>
            )}
            {boardTexture.isRainbow && (
              <span className="stat-badge text-green-400 border border-green-600">
                Rainbow
              </span>
            )}
            {boardTexture.isConnected && (
              <span className="stat-badge text-purple-400 border border-purple-600">
                Connected
              </span>
            )}
          </div>

          {/* Draw Possibilities */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Draw Possibilities</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Flush Draw Possible</span>
                <span className={`font-semibold ${boardTexture.hasFlushDraw ? 'text-red-400' : 'text-green-400'}`}>
                  {boardTexture.hasFlushDraw ? 'Yes ⚠️' : 'No ✓'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Straight Draw Possible</span>
                <span className={`font-semibold ${boardTexture.hasStraightDraw ? 'text-yellow-400' : 'text-green-400'}`}>
                  {boardTexture.hasStraightDraw ? 'Yes ⚠️' : 'No ✓'}
                </span>
              </div>
            </div>
          </div>

          {/* Nuts Analysis */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Nut Hands</h4>
            <div className="text-sm text-gray-300">
              <div className="flex justify-between py-1">
                <span>Current Nuts:</span>
                <span className="font-semibold text-yellow-400">Set of Kings</span>
              </div>
              <div className="flex justify-between py-1">
                <span>2nd Nuts:</span>
                <span className="font-semibold">Set of Sevens</span>
              </div>
              <div className="flex justify-between py-1">
                <span>High Card:</span>
                <span className="font-semibold">{boardTexture.highCard}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
