'use client';

import { HAND_MATRIX } from '@/data/mockData';

interface RangeMatrixProps {
  range: Record<string, number>; // hand -> weight (0-1)
  title?: string;
  onCellClick?: (hand: string) => void;
}

export function RangeMatrix({ range, title, onCellClick }: RangeMatrixProps) {
  const getCellColor = (weight: number) => {
    if (weight === 0) return 'bg-gray-800/50 text-gray-600';
    if (weight < 0.25) return 'bg-red-900/60 text-red-300';
    if (weight < 0.5) return 'bg-orange-900/60 text-orange-300';
    if (weight < 0.75) return 'bg-yellow-900/60 text-yellow-300';
    if (weight < 1) return 'bg-green-900/60 text-green-300';
    return 'bg-green-700 text-green-100';
  };

  const isSuited = (hand: string) => hand.includes('s');
  const isPair = (hand: string) => hand[0] === hand[1];

  return (
    <div className="card">
      {title && (
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
          {title}
        </h3>
      )}
      
      <div className="range-matrix">
        {HAND_MATRIX.map((row, rowIdx) =>
          row.map((hand, colIdx) => {
            const weight = range[hand] || 0;
            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`range-cell ${getCellColor(weight)} ${isPair(hand) ? 'font-bold' : ''}`}
                onClick={() => onCellClick?.(hand)}
                title={`${hand}: ${(weight * 100).toFixed(0)}%`}
              >
                {hand.replace('o', '').replace('s', '')}
                {isSuited(hand) && <span className="text-blue-400">s</span>}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-800/50 rounded" />
          <span className="text-gray-500">0%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-yellow-900/60 rounded" />
          <span className="text-gray-500">50%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-700 rounded" />
          <span className="text-gray-500">100%</span>
        </div>
      </div>
    </div>
  );
}
