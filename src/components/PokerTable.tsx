'use client';

import type { Player, Card } from '@/types/poker';
import { PokerCard } from './PokerCard';

interface PokerTableProps {
  players: Player[];
  communityCards: Card[];
  pot: number;
  activePlayerId?: string;
  dealerPosition: number;
  onPlayerClick?: (playerId: string) => void;
  selectedPlayerId?: string | null;
}

// Position coordinates for 8-max table (percentage based)
const POSITIONS = [
  { top: '75%', left: '50%' }, // 0: Bottom center (Hero usually)
  { top: '65%', left: '85%' }, // 1: Bottom right
  { top: '35%', left: '95%' }, // 2: Right
  { top: '10%', left: '80%' }, // 3: Top right
  { top: '5%', left: '50%' },  // 4: Top center
  { top: '10%', left: '20%' }, // 5: Top left
  { top: '35%', left: '5%' },  // 6: Left
  { top: '65%', left: '15%' }, // 7: Bottom left
];

const personaColors: Record<string, string> = {
  aggressive: '#ef4444',
  conservative: '#3b82f6',
  bluffer: '#a855f7',
  tight: '#6b7280',
  loose: '#f59e0b',
  shark: '#14b8a6',
  unknown: '#374151',
};

export function PokerTable({ 
  players, 
  communityCards, 
  pot, 
  activePlayerId,
  dealerPosition,
  onPlayerClick,
  selectedPlayerId,
}: PokerTableProps) {
  const formatStack = (stack: number) => {
    if (stack >= 1000) return `$${(stack / 1000).toFixed(1)}k`;
    return `$${stack}`;
  };

  return (
    <div className="relative w-full aspect-[2/1] max-h-[500px]">
      {/* Table Felt */}
      <div className="absolute inset-4 rounded-[100px] table-felt">
        {/* Center Area - Community Cards & Pot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
          {/* Pot */}
          <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-full">
            <div className="flex -space-x-1">
              <div className="chip chip-green w-6 h-6 text-[8px]">$</div>
              <div className="chip chip-red w-6 h-6 text-[8px]">$</div>
              <div className="chip chip-blue w-6 h-6 text-[8px]">$</div>
            </div>
            <span className="text-yellow-400 font-bold text-lg">${pot}</span>
          </div>

          {/* Community Cards */}
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <PokerCard 
                key={i} 
                card={communityCards[i]} 
                size="md"
                hidden={i >= communityCards.length && communityCards.length > 0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Players */}
      {players.map((player, idx) => {
        const pos = POSITIONS[idx % POSITIONS.length];
        const isActive = player.id === activePlayerId;
        const isSelected = player.id === selectedPlayerId;
        const isDealer = idx === dealerPosition;
        
        return (
          <div
            key={player.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer ${player.isFolded ? 'opacity-40' : ''}`}
            style={{ top: pos.top, left: pos.left }}
            onClick={() => onPlayerClick?.(player.id)}
          >
            {/* Player Seat */}
            <div className={`relative p-3 rounded-xl bg-gray-900/90 border-2 transition-all ${
              isActive ? 'border-yellow-500 glow-warning animate-pulse-soft' : 
              isSelected ? 'border-blue-500 glow-info' :
              'border-gray-700 hover:border-gray-500'
            }`}>
              {/* Dealer Button */}
              {isDealer && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center shadow-lg">
                  D
                </div>
              )}

              {/* Player Info */}
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: player.colorLabel || personaColors[player.persona.type] }}
                >
                  {player.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold truncate max-w-20">
                    {player.isHero ? 'You' : player.name}
                  </div>
                  <div className="text-xs text-gray-400">{formatStack(player.stack)}</div>
                </div>
              </div>

              {/* Hole Cards (for hero) */}
              {player.isHero && player.holeCards && (
                <div className="flex gap-1 justify-center">
                  <PokerCard card={player.holeCards[0]} size="sm" />
                  <PokerCard card={player.holeCards[1]} size="sm" />
                </div>
              )}

              {/* Hidden Cards (for others) */}
              {!player.isHero && !player.isFolded && (
                <div className="flex gap-1 justify-center">
                  <PokerCard hidden size="sm" />
                  <PokerCard hidden size="sm" />
                </div>
              )}

              {/* Current Bet */}
              {player.currentBet > 0 && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-full text-xs">
                  <div className="chip chip-red w-4 h-4 text-[6px]">$</div>
                  <span className="text-yellow-400 font-semibold">${player.currentBet}</span>
                </div>
              )}

              {/* Position Badge */}
              <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-gray-800 rounded text-[10px] font-semibold border border-gray-600">
                {player.position}
              </div>

              {/* Last Action */}
              {player.lastAction?.type && (
                <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-semibold ${
                  player.lastAction.type === 'fold' ? 'bg-gray-700 text-gray-400' :
                  player.lastAction.type === 'raise' || player.lastAction.type === 'bet' ? 'bg-yellow-600 text-yellow-100' :
                  player.lastAction.type === 'all-in' ? 'bg-red-600 text-white' :
                  'bg-green-600 text-white'
                }`}>
                  {player.lastAction.type.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
