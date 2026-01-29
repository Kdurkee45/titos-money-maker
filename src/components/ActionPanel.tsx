'use client';

import { useState } from 'react';

interface ActionPanelProps {
  pot: number;
  toCall: number;
  minRaise: number;
  stack: number;
  onAction?: (action: string, amount?: number) => void;
}

export function ActionPanel({ pot, toCall, minRaise, stack, onAction }: ActionPanelProps) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);
  
  const quickSizes = [
    { label: '1/3 Pot', value: Math.round(pot * 0.33) },
    { label: '1/2 Pot', value: Math.round(pot * 0.5) },
    { label: '2/3 Pot', value: Math.round(pot * 0.66) },
    { label: 'Pot', value: pot },
    { label: '2x Pot', value: pot * 2 },
  ];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
        Your Action
      </h3>

      {/* Current Situation */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div className="p-2 bg-gray-800/50 rounded">
          <div className="text-xs text-gray-500">Pot</div>
          <div className="font-bold text-yellow-400">${pot}</div>
        </div>
        <div className="p-2 bg-gray-800/50 rounded">
          <div className="text-xs text-gray-500">To Call</div>
          <div className="font-bold text-green-400">${toCall}</div>
        </div>
        <div className="p-2 bg-gray-800/50 rounded">
          <div className="text-xs text-gray-500">Your Stack</div>
          <div className="font-bold">${stack}</div>
        </div>
      </div>

      {/* Quick Size Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickSizes.map((size) => (
          <button
            key={size.label}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
              raiseAmount === size.value 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setRaiseAmount(Math.min(size.value, stack))}
          >
            {size.label}
          </button>
        ))}
      </div>

      {/* Raise Slider */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Raise Amount</span>
          <span className="font-bold">${raiseAmount}</span>
        </div>
        <input
          type="range"
          min={minRaise}
          max={stack}
          value={raiseAmount}
          onChange={(e) => setRaiseAmount(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Min: ${minRaise}</span>
          <span>Max: ${stack}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <button 
          className="action-btn action-fold"
          onClick={() => onAction?.('fold')}
        >
          Fold
        </button>
        {toCall === 0 ? (
          <button 
            className="action-btn action-check"
            onClick={() => onAction?.('check')}
          >
            Check
          </button>
        ) : (
          <button 
            className="action-btn action-call"
            onClick={() => onAction?.('call', toCall)}
          >
            Call ${toCall}
          </button>
        )}
        <button 
          className="action-btn action-raise"
          onClick={() => onAction?.('raise', raiseAmount)}
        >
          Raise ${raiseAmount}
        </button>
        <button 
          className="action-btn action-allin"
          onClick={() => onAction?.('all-in', stack)}
        >
          All-In
        </button>
      </div>

      {/* Timer */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Time Remaining</span>
          <span className="font-bold text-yellow-400">15s</span>
        </div>
        <div className="mt-2 h-2 bg-gray-700 rounded overflow-hidden">
          <div className="h-full bg-yellow-500 rounded transition-all" style={{ width: '75%' }} />
        </div>
      </div>
    </div>
  );
}
