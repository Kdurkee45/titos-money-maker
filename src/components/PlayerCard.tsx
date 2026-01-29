'use client';

import type { Player } from '@/types/poker';
import { PokerCard } from './PokerCard';

interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}

const personaStyles: Record<string, string> = {
  aggressive: 'persona-aggressive',
  conservative: 'persona-conservative',
  bluffer: 'persona-bluffer',
  tight: 'persona-tight',
  loose: 'persona-loose',
  shark: 'persona-shark',
  unknown: 'bg-gray-700/50 text-gray-400 border border-gray-600',
};

const personaIcons: Record<string, string> = {
  aggressive: '🔥',
  conservative: '🛡️',
  bluffer: '🎭',
  tight: '🔒',
  loose: '🎰',
  shark: '🦈',
  unknown: '❓',
};

export function PlayerCard({ player, isSelected, onSelect, compact = false }: PlayerCardProps) {
  const formatStack = (stack: number) => {
    if (stack >= 1000) return `${(stack / 1000).toFixed(1)}k`;
    return stack.toString();
  };

  if (compact) {
    return (
      <div 
        className={`card cursor-pointer transition-all hover:border-blue-500 ${isSelected ? 'border-blue-500 glow-info' : ''} ${player.isFolded ? 'opacity-50' : ''}`}
        onClick={onSelect}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: player.colorLabel || '#374151' }}
          >
            {player.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">{player.isHero ? 'You' : player.name}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">{player.position}</span>
            </div>
            <div className="text-sm text-gray-400">${formatStack(player.stack)}</div>
          </div>
          <span className={`persona-badge ${personaStyles[player.persona.type]}`}>
            {personaIcons[player.persona.type]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`card cursor-pointer transition-all hover:border-blue-500 ${isSelected ? 'border-blue-500 glow-info' : ''} ${player.isFolded ? 'opacity-50' : ''}`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: player.colorLabel || '#374151' }}
          >
            {player.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{player.isHero ? 'You' : player.name}</span>
              {player.isHero && (
                <span className="text-xs px-2 py-0.5 bg-blue-600 rounded">HERO</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="px-2 py-0.5 bg-gray-700 rounded">{player.position}</span>
              <span>${formatStack(player.stack)}</span>
            </div>
          </div>
        </div>
        
        {/* Persona Badge */}
        <span className={`persona-badge ${personaStyles[player.persona.type]}`}>
          {personaIcons[player.persona.type]} {player.persona.type}
        </span>
      </div>

      {/* Cards */}
      {player.isHero && player.holeCards && (
        <div className="flex gap-2 mb-3">
          <PokerCard card={player.holeCards[0]} size="sm" />
          <PokerCard card={player.holeCards[1]} size="sm" />
        </div>
      )}

      {/* Current Bet */}
      {player.currentBet > 0 && (
        <div className="text-sm mb-2">
          <span className="text-gray-400">Current Bet:</span>
          <span className="ml-2 text-yellow-500 font-semibold">${player.currentBet}</span>
        </div>
      )}

      {/* Last Action */}
      {player.lastAction && (
        <div className="text-sm mb-3">
          <span className="text-gray-400">Last Action:</span>
          <span className={`ml-2 font-semibold ${
            player.lastAction.type === 'fold' ? 'text-gray-500' :
            player.lastAction.type === 'raise' || player.lastAction.type === 'bet' ? 'text-yellow-500' :
            player.lastAction.type === 'all-in' ? 'text-red-500' :
            'text-green-500'
          }`}>
            {player.lastAction.type?.toUpperCase()}
            {player.lastAction.amount && ` $${player.lastAction.amount}`}
          </span>
        </div>
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="stat-badge flex-col">
          <span className="text-xs text-gray-500">VPIP</span>
          <span className="font-semibold">{player.stats.vpip}%</span>
        </div>
        <div className="stat-badge flex-col">
          <span className="text-xs text-gray-500">PFR</span>
          <span className="font-semibold">{player.stats.pfr}%</span>
        </div>
        <div className="stat-badge flex-col">
          <span className="text-xs text-gray-500">3-Bet</span>
          <span className="font-semibold">{player.stats.threeBet}%</span>
        </div>
      </div>

      {/* Persona Traits */}
      <div className="mt-3 flex flex-wrap gap-1">
        {player.persona.traits.slice(0, 3).map((trait, i) => (
          <span key={i} className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400">
            {trait}
          </span>
        ))}
      </div>

      {/* Notes */}
      {player.notes && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-200">
          📝 {player.notes}
        </div>
      )}
    </div>
  );
}
